import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../../public/audio/library/');
const OUTPUT_DIR = path.join(__dirname, '../../public/audio/library_normalized/');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

for (const file of files) {
  const inputPath = path.join(INPUT_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);

  console.log(`Normalizing and trimming ${file}...`);
  try {
    // Applica normalizzazione loudness, taglia a 6s, fadein di 1s, fadeout ultimo secondo
    // Nota: fade-in da 0 a 1s, fade-out da 5s a 6s
    execSync(
      `ffmpeg -i "${inputPath}" -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=1,afade=t=out:st=5:d=1" -t 6 "${outputPath}" -y`,
      { stdio: 'inherit' }
    );
    console.log(`✅ ${file} normalizzato e tagliato`);
  } catch (e) {
    console.error(`❌ Errore su ${file}:`, e.message);
  }
}
console.log('✅ Tutti i sample normalizzati, tagliati e con fade in /public/audio/library_normalized/');
