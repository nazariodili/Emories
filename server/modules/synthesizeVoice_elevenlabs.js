import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Converte un testo in voce sintetica con ElevenLabs e salva il file mp3.
 * 
 * @param {string} text - Testo da sintetizzare
 * @param {string} outputFolderPath - Cartella di output (es. story_003)
 * @param {string} fileName - Nome del file da salvare (default: voce_ai.mp3)
 * @param {string} voiceId - ID della voce ElevenLabs (default: impostato nel .env)
 * @returns {Promise<string>} - Path completo del file generato
 */
export async function synthesizeVoiceFromText(
  text,
  outputFolderPath,
  fileName = "voce_ai.mp3",
  voiceId = process.env.ELEVENLABS_VOICE_ID
) {
  const outputPath = path.join(outputFolderPath, fileName);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Errore TTS ElevenLabs:", error);
      throw new Error(`Errore nella sintesi vocale: ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));

    console.log("🗣️ Voce ElevenLabs salvata in:", outputPath);
    return outputPath;
  } catch (err) {
    console.error("❌ Errore in synthesizeVoiceFromText:", err);
    throw err;
  }
}
