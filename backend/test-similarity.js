const stringSimilarity = require('string-similarity');
const fuzz = require('fuzzball');

const examples = [
  ['Yara Moi', 'Ameerat Al Arab'],
  ['Club de Nuit Bling', 'Club de Nuit Maleka'],
  ['Lattafa Asad', 'Lattafa Fakhar'],
  ['Fackar Gold', 'Fakhar Gold Lattafa'],
  ['Club de Nuit', 'Club de Nuit Intense']
];

console.log('--- STRING SIMILARITY ---');
for (const [a, b] of examples) {
  console.log(`"${a}" vs "${b}" -> Score:`, stringSimilarity.compareTwoStrings(a.toLowerCase(), b.toLowerCase()).toFixed(2));
}

console.log('\n--- FUZZBALL TOKEN SET RATIO ---');
for (const [a, b] of examples) {
  console.log(`"${a}" vs "${b}" -> Score:`, fuzz.token_set_ratio(a.toLowerCase(), b.toLowerCase()));
}
