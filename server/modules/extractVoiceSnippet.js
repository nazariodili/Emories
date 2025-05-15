import { execSync } from "child_process";
import fs from "fs";

export function extractFirst10Seconds(inputPath, outputPath) {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error("❌ File input non trovato: " + inputPath);
    }

    execSync(`ffmpeg -y -i "${inputPath}" -t 10 -ar 44100 -ac 1 -vn "${outputPath}"`);
    console.log("🎧 voce_utente_trimmed.mp3 creato con successo:", outputPath);
  } catch (err) {
    console.error("❌ Errore in extractFirst10Seconds:", err);
    throw err;
  }
}
