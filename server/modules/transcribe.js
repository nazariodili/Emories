import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

/**
 * Converte l'audio in mp3 e invia a Whisper per ottenere trascrizione temporizzata (con segmenti).
 * Salva transcript.json (per sync) e trascrizione.txt (solo testo) nella cartella output.
 * 
 * @param {string} inputFile - Path file audio di input (.webm o .mp3)
 * @param {string} outputFolderPath - Cartella story_XYZ dove salvare output
 * @returns {Promise<{ transcript: object, text: string, convertedPath: string }>}
 */
export async function transcribeAudio(inputFile, outputFolderPath) {
  let convertedPath;
  const inputIsMp3 = path.extname(inputFile).toLowerCase() === ".mp3";
  const destMp3 = path.join(outputFolderPath, "audio_utente.mp3");

  // Se è già un mp3 nella cartella giusta, evita la conversione
  if (inputIsMp3 && path.dirname(inputFile) === outputFolderPath) {
    convertedPath = inputFile;
    console.log(`🎙️  Salto conversione, uso direttamente: ${convertedPath}`);
  } else {
    // Altrimenti, converti in mp3 mono, 44.1kHz
    convertedPath = destMp3;
    execSync(`ffmpeg -y -i "${inputFile}" -ar 44100 -ac 1 "${convertedPath}"`);
    console.log(`🎙️  Audio convertito: ${convertedPath}`);
  }

  // Prepara form per OpenAI Whisper (JSON = segmenti temporizzati)
  const formData = new FormData();
  formData.append("file", fs.createReadStream(convertedPath));
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json"); // <-- ATTENZIONE: 'verbose_json' per segmenti!
  // formData.append("language", "it");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("❌ Whisper API error:", err);
    throw new Error(err);
  }

  // Parsing e logging per debug
  const whisperResult = await response.json();
  console.log("✅ Trascrizione ricevuta:", JSON.stringify(whisperResult, null, 2).slice(0, 200) + "...");

  // 🌍 Lingua rilevata
  console.log("🌍 Lingua rilevata:", whisperResult.language);


  // Salva la trascrizione con segmenti (per sync testo-audio)
  const transcriptPath = path.join(outputFolderPath, "transcript.json");
  fs.writeFileSync(transcriptPath, JSON.stringify(whisperResult, null, 2), "utf-8");
  console.log(`💾 Salvata trascrizione: ${transcriptPath}`);

  // Salva anche il testo puro (retrocompatibilità o debug)
  const transcriptTxtPath = path.join(outputFolderPath, "trascrizione.txt");
  fs.writeFileSync(transcriptTxtPath, whisperResult.text, "utf-8");
  console.log(`💾 Salvata trascrizione txt: ${transcriptTxtPath}`);

  // 🔥 Ritorna tutto: transcript (per sync), text (per LLM), e path audio
  return {
    transcript: whisperResult,   // Oggetto JSON con segmenti e timing
    text: whisperResult.text,    // Solo testo per uso GPT
    language: whisperResult.language, // lingua rilevata
    convertedPath                // Percorso mp3 eventualmente convertito
  };
}
