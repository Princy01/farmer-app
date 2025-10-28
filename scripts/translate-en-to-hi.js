const fs = require('fs');
const translate = require('google-translate-api-x');

const enFile = './src/assets/i18n/en.json';
const hiFile = './src/assets/i18n/hi.json';

async function translateFile() {
  const enJson = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  const hiJson = {};

  for (const key of Object.keys(enJson)) {
    try {
      const res = await translate(enJson[key], { to: 'hi' });
      hiJson[key] = res.text;
      console.log(`Translated: ${enJson[key]} → ${res.text}`);
    } catch (err) {
      console.error(`Error translating "${enJson[key]}":`, err);
      hiJson[key] = enJson[key]; // fallback to English
    }
  }

  fs.writeFileSync(hiFile, JSON.stringify(hiJson, null, 2), 'utf8');
  console.log('Hindi translation complete!');
}

translateFile();