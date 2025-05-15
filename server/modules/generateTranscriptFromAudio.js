import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

/**
 * Genera transcript.json da voce_ai.mp3 per sincronizzazione testuale.
 *
 * @param {string} mp3Path - Percorso del file mp3 (es: /stories/story_003/voce_ai.mp3)
 * @param {string} outputFolderPath - Cartella dove salvare transcript.json
 * @returns {Promise<Array>} - Array segmenti [{text, start, end}]
 */
export async function generateTranscriptFromAudio(mp3Path, outputFolderPath) {
  try {
    console.log("📥 Inizio trascrizione per sincronizzazione:", mp3Path);

    if (!fs.existsSync(mp3Path)) {
      throw new Error(`❌ File non trovato: ${mp3Path}`);
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(mp3Path));
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Whisper (TTS sync) error:", err);
      throw new Error("Errore durante la trascrizione del TTS");
    }

    const data = await response.json();

    if (!data.segments || !Array.isArray(data.segments)) {
      throw new Error("❌ Risposta inattesa: segments non trovati");
    }

    const segments = data.segments.map((seg) => ({
      text: seg.text.trim(),
      start: parseFloat(seg.start.toFixed(2)),
      end: parseFloat(seg.end.toFixed(2)),
    }));

    // 💾 Salva come transcript.json nella cartella della storia
    const outputPath = path.join(outputFolderPath, "transcript.json");
    fs.writeFileSync(outputPath, JSON.stringify({ segments }, null, 2), "utf-8");

    console.log(`✅ transcript.json salvato in: ${outputPath}`);
    return segments;
  } catch (err) {
    console.error("❌ Errore in generateTranscriptFromAudio:", err);
    throw err;
  }
}
