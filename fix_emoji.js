const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// Fix mojibake: re-encode CP1252-interpreted UTF-8 back to correct UTF-8
// Each corrupted sequence = UTF-8 bytes of emoji misread as CP1252, then re-encoded as UTF-8
const fix = [
  ['ðŸ—³ï¸', '🗳️'],
  ['ðŸ‡®ðŸ‡³', '🇮🇳'],
  ['ðŸ"‹', '📋'],
  ['ðŸ"œ', '📜'],
  ['ðŸ"\x9d', '📝'],
  ['ðŸ"\x8d', '🔍'],
  ['â†©ï¸', '↩️'],
  ['ðŸ"¢', '📢'],
  ['ðŸ"Š', '📊'],
  ['ðŸ ', '🏠'],
  ['ðŸ¡ ', '🏡'],
  ['ðŸ'¡', '💡'],
  ['ðŸŽ¬', '🎬'],
  ['ðŸ"', '📊'],
  ['ðŸ‡®ðŸ‡³', '🇮🇳'],
  ['â€"', '\u2014'],
  ['dY-3\x9d,?', '🗳️'],
  ['\ufffd-\u0014 Watch on YouTube \ufffd+\'', '▶ Watch on YouTube →'],
  ['ðŸ"¢', '📢'],
  ['ðŸ"', '📝'],
  ['ðŸƒ', '🃏'],
];

for (const [bad, good] of fix) {
  c = c.split(bad).join(good);
}

// Also fix any remaining corrupted sequences using byte-level reversal
// Find all sequences starting with ðŸ and try to decode them
c = c.replace(/ð[^\s<>"'{}\[\]()\\]+/g, (match) => {
  try {
    // Convert CP1252 chars back to bytes then decode as UTF-8
    const bytes = [];
    for (const ch of match) {
      const cp = ch.codePointAt(0);
      if (cp < 256) bytes.push(cp);
      else return match; // can't fix, leave as-is
    }
    const result = Buffer.from(bytes).toString('utf8');
    // Only return if it decoded to something valid (has non-ASCII)
    if (result && result !== match && !/[\x00-\x08\x0b\x0e-\x1f]/.test(result)) {
      return result;
    }
  } catch(e) {}
  return match;
});

fs.writeFileSync('src/App.jsx', c, 'utf8');
console.log('Done. Fixed emoji encoding.');
