import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

/**
 * Converte l'audio in mp3 e invia a Whisper per ottenere trascrizione.
 * Salva anche un file trascrizione.txt nella cartella output.
 * 
 * @param {string} inputFile - Path file .webm ricevuto dal frontend
 * @param {string} outputFolderPath - Cartella story_XYZ dove salvare output
 * @returns {Promise<string>} - Testo trascritto
 */
export async function transcribeAudio(inputFile, outputFolderPath) {
  const convertedPath = `${outputFolderPath}/audio_utente.mp3`;

  try {
    // 🔄 Converte in mp3 mono, 44.1kHz
    execSync(`ffmpeg -y -i ${inputFile} -ar 44100 -ac 1 ${convertedPath}`);
    console.log(`🎙️  Audio convertito: ${convertedPath}`);

    // 📤 Prepara form per OpenAI Whisper
    const formData = new FormData();
    formData.append("file", fs.createReadStream(convertedPath));
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");
    formData.append("language", "it");

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

    const text = await response.text();
    console.log("✅ Trascrizione ricevuta:", text.slice(0, 100) + "...");

    // 💾 Salva trascrizione anche come file locale
    const transcriptPath = `${outputFolderPath}/trascrizione.txt`;
    fs.writeFileSync(transcriptPath, text, "utf-8");
    console.log(`💾 Salvata trascrizione: ${transcriptPath}`);

    return { text, convertedPath }; // ✅ ritorna entrambi
  } catch (err) {
    console.error("❌ Errore in transcribeAudio:", err);
    throw err;
  }

}
