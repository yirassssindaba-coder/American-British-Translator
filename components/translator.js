'use strict';

const americanOnly = require('./american-only');
const britishOnly = require('./british-only');
const americanToBritishSpelling = require('./american-to-british-spelling');
const americanToBritishTitles = require('./american-to-british-titles');

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const invertMap = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[v] = k;
  return out;
};

const isUpper = (ch) => ch >= 'A' && ch <= 'Z';
const matchCase = (source, target) => {
  if (source && isUpper(source[0])) return target.charAt(0).toUpperCase() + target.slice(1);
  return target;
};

// Replace ONLY outside existing highlight spans (prevents nested/HTML corruption)
const replaceOutsideHighlights = (input, regex, replacer) => {
  const parts = input.split(/(<span class="highlight">.*?<\/span>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<span class="highlight">')) continue;
    parts[i] = parts[i].replace(regex, replacer);
  }
  return parts.join('');
};

class Translator {
  translate(text, locale) {
    if (typeof text !== 'string') return '';

    const isA2B = locale === 'american-to-british';
    const isB2A = locale === 'british-to-american';
    if (!isA2B && !isB2A) return '';

    const a2bTerms = { ...americanOnly, ...americanToBritishSpelling };
    const b2aTerms = { ...britishOnly, ...invertMap(americanToBritishSpelling) };

    const a2bTitles = americanToBritishTitles;            // mr. -> mr
    const b2aTitles = invertMap(americanToBritishTitles); // mr -> mr.

    let translated = text;
    let changed = false;

    // 1) Time conversion + highlight
    if (isA2B) {
      // 12:15 -> 12.15
      translated = replaceOutsideHighlights(
        translated,
        /\b([0-9]|1[0-2]):([0-5][0-9])\b/g,
        (m, h, mm) => {
          changed = true;
          return `<span class="highlight">${h}.${mm}</span>`;
        }
      );
    } else {
      // 4.30 -> 4:30
      translated = replaceOutsideHighlights(
        translated,
        /\b([0-9]|1[0-2])\.([0-5][0-9])\b/g,
        (m, h, mm) => {
          changed = true;
          return `<span class="highlight">${h}:${mm}</span>`;
        }
      );
    }

    // 2) Titles/honorifics
    // IMPORTANT: jangan pakai \b setelah '.' karena gagal match.
    const applyTitleMap = (input, titleMap) => {
      const keys = Object.keys(titleMap).sort((a, b) => b.length - a.length);
      let out = input;

      for (const key of keys) {
        const val = titleMap[key];
        const keyEsc = escapeRegExp(key);

        // title biasanya diikuti spasi + Nama
        // - kalau key punya titik: \bMr\.(?=\s)
        // - kalau tidak: \bMr\b(?=\s)
        const re = key.endsWith('.')
          ? new RegExp(`\\b${keyEsc}(?=\\s)`, 'gi')
          : new RegExp(`\\b${keyEsc}\\b(?=\\s)`, 'gi');

        out = replaceOutsideHighlights(out, re, (matched) => {
          changed = true;
          const repl = matchCase(matched, val);
          return `<span class="highlight">${repl}</span>`;
        });
      }
      return out;
    };

    translated = isA2B
      ? applyTitleMap(translated, a2bTitles)
      : applyTitleMap(translated, b2aTitles);

    // 3) Terms/spellings
    const applyTermsMap = (input, map) => {
      const keys = Object.keys(map).sort((a, b) => b.length - a.length);
      let out = input;

      for (const key of keys) {
        const val = map[key];
        const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'gi');

        out = replaceOutsideHighlights(out, re, (matched) => {
          changed = true;
          const repl = matchCase(matched, val);
          return `<span class="highlight">${repl}</span>`;
        });
      }
      return out;
    };

    translated = isA2B
      ? applyTermsMap(translated, a2bTerms)
      : applyTermsMap(translated, b2aTerms);

    if (!changed) return 'Everything looks good to me!';
    return translated;
  }
}

module.exports = Translator;
