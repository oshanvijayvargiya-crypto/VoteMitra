const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// Byte-level mojibake fix: chars misread as CP1252, re-encoded as UTF-8
// Strategy: find sequences starting with 0xC3/0xC2 patterns (signs of double UTF-8 encoding)
// and decode them back. Use Buffer trick.
function fixMojibake(str) {
  // Convert string to Latin-1 bytes then decode as UTF-8
  const bytes = [];
  let i = 0;
  while (i < str.length) {
    const cp = str.codePointAt(i);
    if (cp < 128) {
      bytes.push(cp);
      i++;
    } else if (cp < 256) {
      bytes.push(cp);
      i++;
    } else {
      // Multi-code-point char - encode as UTF-8
      const encoded = Buffer.from(str[i], 'utf8');
      for (const b of encoded) bytes.push(b);
      i++;
    }
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch(e) {
    return str;
  }
}

// Apply fix to whole file
const fixed = fixMojibake(c);
fs.writeFileSync('src/App.jsx', fixed, 'utf8');
console.log('Done');
