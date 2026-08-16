const fs = require('fs');
const path = require('path');

const clientJs = fs.readFileSync('public/client.js', 'utf8');

// Parse COUNTRY_CODE_BY_NAME
const mapMatch = clientJs.match(/const COUNTRY_CODE_BY_NAME = Object\.freeze\(\{([\s\S]*?)\}\);/);
const mapText = mapMatch[1];
const codeMap = {};
mapText.split('\n').forEach(line => {
  const m = line.match(/^\s*"?([a-zA-Z0-9\s\-]+)"?\s*:\s*"([a-z0-9]+)"/);
  if (m) codeMap[m[1].toLowerCase().trim()] = m[2];
});

// Parse COUNTRY_FLAG_DESIGN_BY_CODE
const designMatch = clientJs.match(/const COUNTRY_FLAG_DESIGN_BY_CODE = Object\.freeze\(\{([\s\S]*?)\}\);/);
const designText = designMatch[1];
const designCodes = new Set();
designText.split('\n').forEach(line => {
  const m = line.match(/^\s*([a-z0-9]+): \{/);
  if (m) designCodes.add(m[1]);
});

// Recursively find all expansion files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const expansionFiles = getAllFiles('expansions');
const countriesInCards = new Set();
const cardCountries = [];

expansionFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(/country:\s*"([^"]+)"/);
  if (match) {
    const c = match[1].trim();
    countriesInCards.add(c);
    cardCountries.push({ file: path.basename(file), country: c });
  }
});

const unmappedCountries = new Set();
const missingDesignCodes = new Set();

countriesInCards.forEach(country => {
  if (country === "Arcana") return; // "Arcana" is the fictional fallback faction, renders arcana fallback flag
  const key = country.toLowerCase().trim();
  if (!codeMap[key]) {
    unmappedCountries.add(country);
  } else {
    const code = codeMap[key];
    if (!designCodes.has(code)) {
      missingDesignCodes.add(`${code} (${country})`);
    }
  }
});

console.log('Total unique card countries:', countriesInCards.size);
console.log('All countries list:', Array.from(countriesInCards).sort());
console.log('Unmapped real countries (no ISO code):', Array.from(unmappedCountries));
console.log('ISO codes missing flag SVG design:', Array.from(missingDesignCodes));
