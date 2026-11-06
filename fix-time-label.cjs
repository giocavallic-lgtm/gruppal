const fs = require('fs');
let s = fs.readFileSync('src/pages/ChampionshipDetail.tsx', 'utf8');
s = s.replace(/\r\n/g, '\n');

// Replace the time label
const oldLabel = `{isTimes\n              ? 'Introduce el tiempo de cada participante (en segundos). Deja vacío si no participó. La posición se calcula sola.'\n              : 'Pon la posición de llegada de cada participante. Deja vacío si no participó. Los puntos se calculan solos.'}\n          `;
const newLabel = `{isTimes\n              ? 'Introduce el tiempo de cada participante. Usa horas, minutos, segundos y milisegundos.'\n              : 'Pon la posición de llegada de cada participante. Deja vacío si no participó. Los puntos se calculan solos.'}\n          `;

if (s.includes(oldLabel)) {
  s = s.replace(oldLabel, newLabel);
  fs.writeFileSync('src/pages/ChampionshipDetail.tsx', s);
  console.log('Label updated');
} else {
  console.log('Pattern not found - searching for partial...');
  // Try partial
  if (s.includes("Introduce el tiempo de cada participante (en segundos)")) {
    console.log('Found old text fragment');
  }
  if (s.includes("Usa horas, minutos, segundos y milisegundos")) {
    console.log('New text already present');
  }
}