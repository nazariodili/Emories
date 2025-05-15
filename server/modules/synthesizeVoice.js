import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Converte un testo in voce sintetica basandosi sui parametri di generazione del preset.
 * 
 * @param {string} text - Testo da sintetizzare (la microstoria)
 * @param {string} outputFolderPath - Cartella in cui salvare il file
 * @param {object} generation - Oggetto preset.generation con { voice, voicePrompt }
 * @param {string} fileName - (opzionale) Nome file (default: voce_ai.mp3)
 * @returns {Promise<Buffer>} - Audio mp3 come Buffer (e salvato su disco)
 */
export async function synthesizeVoiceFromText(
  text,
  outputFolderPath,
  generation,
  fileName = "voce_ai.mp3"
) {
  const outputPath = path.join(outputFolderPath, fileName);
  const voice = generation.voice || "shimmer";
  const instructions = generation.voicePrompt || "";

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: text,
        voice,
        instructions,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Errore TTS OpenAI:", error);
      throw new Error(`Errore nella sintesi vocale: ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, audioBuffer);

    console.log("🗣️ Voce AI salvata in:", outputPath);
    return audioBuffer;
  } catch (err) {
    console.error("❌ Errore in synthesizeVoiceFromText:", err);
    throw err;
  }
}
