import { translations } from './translations.js?v=nocache2';

const VALID_LANGUAGES = ['pt', 'en', 'es', 'de', 'fr', 'it'];
const DEFAULT_LANGUAGE = 'pt';

// Get language from localStorage or browser preference or default
function getInitialLanguage() {
  const saved = localStorage.getItem('maia-site-lang');
  if (saved && VALID_LANGUAGES.includes(saved)) {
    return saved;
  }
  
  // Optional: check browser language
  const browserLang = navigator.language.split('-')[0];
  if (VALID_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANGUAGE;
}

let currentLanguage = getInitialLanguage();

export function getCurrentLanguage() {
  return currentLanguage;
}

export function updatePageTranslations() {
  const langData = translations[currentLanguage];
  if (!langData) return;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (langData[key]) {
      const translation = langData[key];
      // Check if it's an input placeholder or text content
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        // If translation contains HTML tags, use innerHTML, else textContent
        // This is safe here because translations are trusted static content
        if (translation.includes('<')) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    }
  });

  // Update active flag state
  document.querySelectorAll('#floating-lang-selector .lang-flag').forEach(flag => {
    const title = flag.getAttribute('title');
    // Map titles to lang codes (naive mapping, better to check href or add data-lang)
    let flagLang = '';
    if (title === 'Português') flagLang = 'pt';
    else if (title === 'English') flagLang = 'en';
    else if (title === 'Español') flagLang = 'es';
    else if (title === 'Deutsch') flagLang = 'de';
    else if (title === 'Français') flagLang = 'fr';
    else if (title === 'Italiano') flagLang = 'it';

    if (flagLang === currentLanguage) {
      flag.classList.add('active');
    } else {
      flag.classList.remove('active');
    }
  });

  // Dispatch event for other scripts
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

export function setLanguage(lang) {
  if (!VALID_LANGUAGES.includes(lang)) return;
  currentLanguage = lang;
  localStorage.setItem('maia-site-lang', lang);
  updatePageTranslations();
}

function initLanguageSelector() {
  const flags = document.querySelectorAll('#floating-lang-selector .lang-flag');
  flags.forEach(flag => {
    flag.addEventListener('click', (e) => {
      e.preventDefault();
      const title = flag.getAttribute('title');
      let lang = 'pt';
      if (title === 'Português') lang = 'pt';
      else if (title === 'English') lang = 'en';
      else if (title === 'Español') lang = 'es';
      else if (title === 'Deutsch') lang = 'de';
      else if (title === 'Français') lang = 'fr';
      else if (title === 'Italiano') lang = 'it';
      
      setLanguage(lang);
    });
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initLanguageSelector();
  updatePageTranslations();
});

// Also expose global for non-module scripts if needed
window.MaiaI18n = {
  setLanguage,
  getCurrentLanguage,
  updatePageTranslations,
  translations
};
