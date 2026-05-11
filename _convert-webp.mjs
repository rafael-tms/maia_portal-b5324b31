// Batch WebP conversion: backup -> download -> convert -> upload -> update DB -> delete originals
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SB_URL = 'https://jwokndgjfvchpkyuntit.supabase.co';
const SERVICE_KEY = process.env.SB_SERVICE_ROLE_KEY;
const BUCKET = 'images';
const PUBLIC_PREFIX = `${SB_URL}/storage/v1/object/public/${BUCKET}/`;
const DRY_RUN = process.env.DRY_RUN === '1';
const TS = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = `/mnt/documents/backup-images-${TS}`;

const supabase = createClient(SB_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Tables and columns that may hold image URLs
const URL_COLUMNS = [
  { table: 'gallery', cols: ['image_url'] },
  { table: 'news', cols: ['image_url'] },
  { table: 'today_cards', cols: ['left_image_url', 'news_image_url'] },
  { table: 'trajectory_cards', cols: ['left_image_url'] },
  { table: 'videos', cols: ['thumbnail_url'] },
];
// montage_items: only rows where type='image', column 'content'

const IMG_EXT = /\.(jpe?g|png)$/i;

async function listAll(prefix = '') {
  const out = [];
  async function walk(p) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage.from(BUCKET).list(p, { limit: 1000, offset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const item of data) {
        const full = p ? `${p}/${item.name}` : item.name;
        if (item.id === null || item.metadata == null) {
          // folder
          await walk(full);
        } else {
          out.push({ path: full, size: item.metadata?.size || 0 });
        }
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }
  await walk(prefix);
  return out;
}

async function backup(files) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Backing up ${files.length} files to ${BACKUP_DIR}`);
  let i = 0;
  for (const f of files) {
    const dest = path.join(BACKUP_DIR, f.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const { data, error } = await supabase.storage.from(BUCKET).download(f.path);
    if (error) { console.warn('backup fail', f.path, error.message); continue; }
    const buf = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(dest, buf);
    i++;
    if (i % 20 === 0) console.log(`  ${i}/${files.length}`);
  }
  console.log(`Backup complete: ${i}/${files.length}`);
}

async function updateDbReferences(oldUrl, newUrl) {
  let updated = 0;
  for (const { table, cols } of URL_COLUMNS) {
    for (const col of cols) {
      const { data, error } = await supabase.from(table).update({ [col]: newUrl }).eq(col, oldUrl).select('id');
      if (error) { console.warn(`  DB ${table}.${col} fail:`, error.message); continue; }
      updated += data?.length || 0;
    }
  }
  // montage_items
  const { data, error } = await supabase.from('montage_items').update({ content: newUrl }).eq('content', oldUrl).select('id');
  if (!error) updated += data?.length || 0;
  else console.warn('  montage_items fail:', error.message);
  return updated;
}

async function main() {
  console.log(`MODE: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  console.log('Listing all storage files...');
  const all = await listAll('');
  console.log(`Total files: ${all.length}`);
  const candidates = all.filter(f => IMG_EXT.test(f.path));
  console.log(`Convertible (jpg/png): ${candidates.length}`);
  const totalOrigSize = candidates.reduce((s, f) => s + f.size, 0);
  console.log(`Total original size: ${(totalOrigSize/1024/1024).toFixed(2)} MB`);

  // Backup ALL files first (full safety net)
  if (!DRY_RUN) await backup(all);

  const report = { converted: 0, skipped: 0, failed: 0, dbUpdated: 0, originalBytes: 0, newBytes: 0, items: [] };

  for (const f of candidates) {
    try {
      const oldUrl = PUBLIC_PREFIX + f.path;
      const newPath = f.path.replace(IMG_EXT, '.webp');
      const newUrl = PUBLIC_PREFIX + newPath;

      // Download
      const { data: blob, error: dErr } = await supabase.storage.from(BUCKET).download(f.path);
      if (dErr) throw new Error('download: ' + dErr.message);
      const orig = Buffer.from(await blob.arrayBuffer());

      // Convert
      const converted = await sharp(orig, { failOnError: false })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      if (converted.length >= orig.length) {
        console.log(`SKIP (webp larger) ${f.path}  ${orig.length} -> ${converted.length}`);
        report.skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`DRY ${f.path} -> ${newPath}  ${(orig.length/1024).toFixed(1)}KB -> ${(converted.length/1024).toFixed(1)}KB`);
        report.converted++;
        report.originalBytes += orig.length;
        report.newBytes += converted.length;
        continue;
      }

      // Upload new webp
      const { error: uErr } = await supabase.storage.from(BUCKET).upload(newPath, converted, {
        contentType: 'image/webp', upsert: true,
      });
      if (uErr) throw new Error('upload: ' + uErr.message);

      // Update DB references
      const updated = await updateDbReferences(oldUrl, newUrl);
      report.dbUpdated += updated;

      // Delete original
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([f.path]);
      if (rmErr) console.warn(`  delete original fail: ${rmErr.message}`);

      report.converted++;
      report.originalBytes += orig.length;
      report.newBytes += converted.length;
      report.items.push({ from: f.path, to: newPath, dbRefs: updated, oldKB: (orig.length/1024).toFixed(1), newKB: (converted.length/1024).toFixed(1) });
      console.log(`OK ${f.path} -> ${newPath}  ${(orig.length/1024).toFixed(1)}KB -> ${(converted.length/1024).toFixed(1)}KB  dbRefs=${updated}`);
    } catch (e) {
      report.failed++;
      console.error(`FAIL ${f.path}: ${e.message}`);
    }
  }

  const reportPath = `/mnt/documents/webp-conversion-report-${TS}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n===== REPORT =====');
  console.log(`Converted: ${report.converted}`);
  console.log(`Skipped:   ${report.skipped}`);
  console.log(`Failed:    ${report.failed}`);
  console.log(`DB refs updated: ${report.dbUpdated}`);
  console.log(`Bytes: ${(report.originalBytes/1024/1024).toFixed(2)} MB -> ${(report.newBytes/1024/1024).toFixed(2)} MB  (saved ${((1 - report.newBytes/Math.max(1,report.originalBytes))*100).toFixed(1)}%)`);
  console.log(`Backup: ${DRY_RUN ? '(skipped)' : BACKUP_DIR}`);
  console.log(`Report: ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
