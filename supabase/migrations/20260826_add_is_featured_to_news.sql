-- Notícia em destaque: a que ocupa o card grande em "Na Mídia".
--
-- Antes era implícito — o site pegava a primeira da ordenação, e a única forma
-- de trocar era reordenar. Agora é uma escolha explícita no admin.
--
-- Só uma notícia fica marcada por vez; o editor limpa as demais ao definir uma.
-- O índice parcial garante isso no banco, mesmo se algo escrever por fora.

ALTER TABLE news ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS news_unico_destaque
  ON news ((is_featured))
  WHERE is_featured;
