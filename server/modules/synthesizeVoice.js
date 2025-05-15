import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Converte un testo in voce sintetica e salva il file mp3.
 * 
 * @param {string} text - Testo da sintetizzare
 * @param {string} outputFolderPath - Cartella di output (es. story_003)
 * @param {string} fileName - Nome del file da salvare (default: voce_ai.mp3)
 * @param {string} voice - Voce TTS da usare (default: nova)
 * @returns {Promise<string>} - Path completo del file generato
 */
export async function synthesizeVoiceFromText(
  text,
  outputFolderPath,
  fileName = "voce_ai.mp3",
  voice = "shimmer",
  instructions = "Affect/personality: You're a audiobook narrator with soft, introspective, and intimate interpretation; convey a sense of wonder and emotional depth.\n\nTone: Friendly, clear, and reassuring, creating a calm atmosphere, making the listener feel confident and comfortable and warm—imbued with gentle melancholy and tender hope\n\nPacing: Give each phrase time to breathe, inviting the listener to linger inside the memory.\n\nPronunciation: Clear, articulate, and steady, ensuring each instruction is easily understood while maintaining a natural, conversational flow.\n\nPause: Brief, purposeful pauses after key instructions (e.g., \"cross the street\" and \"turn right\") to allow time for the listener to process the information and follow along.\n\nEmotion: Warm and supportive, conveying empathy and care, ensuring the listener feels guided and safe throughout the journey. Heartfelt emotion with an undercurrent of longing."
) {
  const outputPath = path.join(outputFolderPath, fileName);
  

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

    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));

    console.log("🗣️ Voce TTS salvata in:", outputPath);
    return outputPath;
  } catch (err) {
    console.error("❌ Errore in synthesizeVoiceFromText:", err);
    throw err;
  }
}