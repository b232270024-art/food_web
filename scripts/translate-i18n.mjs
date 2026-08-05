#!/usr/bin/env node
// Auto-fills frontend/src/i18n/translations.js — for every EN key that isn't
// listed in frontend/src/i18n/manualKeys.js, generates ar/hi text if it's
// missing (or, with --force, even if it already exists).
//
// Usage:
//   node scripts/translate-i18n.mjs                # fill missing keys only
//   node scripts/translate-i18n.mjs --force=heroBtn,cartClear
//   node scripts/translate-i18n.mjs --force-all     # re-translate everything non-manual
//
// Uses Google Cloud Translation (GOOGLE_TRANSLATE_API_KEY, better quality) if
// set, otherwise falls back to the free MyMemory API — same optional-paid /
// free-fallback pattern as src/routes/geocode.js.
//
// Output is a machine-translation draft, not a publish-ready string: have a
// fluent AR/HI speaker review it before shipping.

import 'dotenv/config';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { t, LANGUAGES } from '../frontend/src/i18n/translations.js';
import { MANUAL_KEYS } from '../frontend/src/i18n/manualKeys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_PATH = path.join(__dirname, '../frontend/src/i18n/translations.js');
const MANUAL_KEY_SET = new Set(MANUAL_KEYS);

const args = process.argv.slice(2);
const forceAll = args.includes('--force-all');
const forceArg = args.find((a) => a.startsWith('--force='));
const forceKeys = new Set(forceArg ? forceArg.slice('--force='.length).split(',') : []);

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateGoogle(text, target) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;
  const url = `https://translation.googleapis.com/language/translate/v2?key=${key}&q=${encodeURIComponent(text)}&source=en&target=${target}&format=text`;
  const data = await httpGetJson(url);
  return data?.data?.translations?.[0]?.translatedText ?? null;
}

// MyMemory's top-level "translatedText" pick can be a community placeholder
// (e.g. "[translation of term: X]") instead of a real translation, so we
// pick the best-scoring real match ourselves and only fall back to it last.
async function translateMyMemory(text, target) {
  const email = process.env.TRANSLATE_CONTACT_EMAIL;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}${email ? `&de=${encodeURIComponent(email)}` : ''}`;
  const data = await httpGetJson(url);
  const isPlaceholder = (s) => typeof s === 'string' && /^\[.*\]$/.test(s.trim());
  const best = (data?.matches ?? [])
    .filter((m) => !isPlaceholder(m.translation))
    .sort((a, b) => (b.match - a.match) || (b.quality - a.quality))[0];
  if (best) return best.translation;
  const fallback = data?.responseData?.translatedText;
  return isPlaceholder(fallback) ? null : (fallback ?? null);
}

async function translateText(text, target) {
  if (!text) return text;
  const viaGoogle = await translateGoogle(text, target).catch(() => null);
  if (viaGoogle) return viaGoogle;
  const viaMyMemory = await translateMyMemory(text, target).catch(() => null);
  return viaMyMemory ?? text; // never write a blank — worst case, leave the English text in place
}

async function translateValue(value, target) {
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(await translateText(item, target));
      await sleep(250);
    }
    return out;
  }
  const result = await translateText(value, target);
  await sleep(250);
  return result;
}

function serializeValue(value) {
  if (Array.isArray(value)) {
    const items = value.map((v) => `      ${JSON.stringify(v)},`).join('\n');
    return `[\n${items}\n    ]`;
  }
  return JSON.stringify(value);
}

function findBlock(source, langCode) {
  const startMarker = `  ${langCode}: {`;
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`Could not find "${langCode}: {" block in translations.js`);
  const bodyStart = startIdx + startMarker.length;
  const closeIdx = source.indexOf('\n  },', bodyStart);
  if (closeIdx === -1) throw new Error(`Could not find closing brace for "${langCode}" block`);
  return { bodyStart, closeIdx };
}

function insertKeys(source, langCode, entries) {
  const { closeIdx } = findBlock(source, langCode);
  const lines = entries.map(([key, value]) => `    ${key}: ${serializeValue(value)},`).join('\n');
  return `${source.slice(0, closeIdx)}\n${lines}${source.slice(closeIdx)}`;
}

function replaceKey(source, langCode, key, value) {
  const { bodyStart, closeIdx } = findBlock(source, langCode);
  const block = source.slice(bodyStart, closeIdx);
  const lineRe = new RegExp(`^( {4}${key}:).*$`, 'm');
  if (!lineRe.test(block)) {
    console.warn(`  ! skip --force for "${langCode}.${key}": value spans multiple lines, edit it by hand`);
    return source;
  }
  const newBlock = block.replace(lineRe, `$1 ${serializeValue(value)},`);
  return source.slice(0, bodyStart) + newBlock + source.slice(closeIdx);
}

async function run() {
  const targetLangs = LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');
  let source = fs.readFileSync(TRANSLATIONS_PATH, 'utf8');
  let translatedCount = 0;

  for (const lang of targetLangs) {
    const toInsert = [];
    for (const key of Object.keys(t.en)) {
      if (MANUAL_KEY_SET.has(key)) continue;
      const value = t.en[key];
      if (!value || (Array.isArray(value) && value.length === 0)) continue;

      const exists = Object.prototype.hasOwnProperty.call(t[lang], key);
      const shouldTranslate = forceAll || forceKeys.has(key) || !exists;
      if (!shouldTranslate) continue;

      process.stdout.write(`  translating ${lang}.${key}...\n`);
      const translated = await translateValue(value, lang);
      translatedCount++;

      if (exists) {
        source = replaceKey(source, lang, key, translated);
      } else {
        toInsert.push([key, translated]);
      }
    }
    if (toInsert.length) {
      source = insertKeys(source, lang, toInsert);
    }
  }

  if (translatedCount === 0) {
    console.log('Nothing to translate — every non-manual key already has ar/hi text.');
    console.log('Use --force=key1,key2 or --force-all to re-translate existing keys.');
    return;
  }

  fs.writeFileSync(TRANSLATIONS_PATH, source);
  console.log(`\nDone — ${translatedCount} string(s) auto-translated.`);
  console.log('These are machine translations: have a fluent AR/HI speaker review them before shipping.');
  console.log('Keys in frontend/src/i18n/manualKeys.js were skipped — edit those by hand.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
