import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateNarrativeFrom } from '../modules/generateStory.js';
import { synthesizeVoiceFromText } from "../modules/synthesizeVoice.js";
import { transcribeAudio } from "../modules/transcribe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera l'intera catena per un dato preset: storia, voce, trascrizione.
 * Salva i risultati in stories/story_XYZ/preset_<presetName>/
 *
 * @param {string} storyId - Es. "story_003"
 * @param {object} preset - Oggetto preset con campi .generation.*
 * @returns {Promise<object>} - Percorsi dei file generati
 */
export async function generateStoryFromPreset(storyId, preset) {
  const presetName = preset.name;
  const basePath = path.join(__dirname, "../../stories", storyId);
  const presetPath = path.join(basePath, `preset_${presetName}`);

  if (!fs.existsSync(presetPath)) fs.mkdirSync(presetPath, { recursive: true });

  // === 1. Carica la trascrizione utente originale da trascrizione.txt
  const transcriptTxtPath = path.join(basePath, "trascrizione.txt");
  if (!fs.existsSync(transcriptTxtPath)) {
    throw new Error("❌ trascrizione.txt mancante: impossibile generare la storia.");
  }
  const originalText = fs.readFileSync(transcriptTxtPath, "utf-8").trim();

  // === 2. Genera la microstoria con prompt personalizzato dal preset
  const storyText = await generateNarrativeFrom(
    originalText,
    presetPath,
    "gpt-4",
    preset.generation.storyPrompt
  );

  // === 3. Sintetizza la voce AI (usando preset.generation)
  const audioBuffer = await synthesizeVoiceFromText(
    storyText,
    presetPath,
    preset.generation
  );

  // === 4. Trascrive la voce sintetica per ottenere testo sincronizzato
  const audioPath = path.join(presetPath, "voce_ai.mp3");
  const { text: dummy, convertedPath } = await transcribeAudio(audioPath, presetPath);

  // === 5. Rinomina la trascrizione da "trascrizione.txt" a "transcript.json" (formattato per sync)
  const txtPath = path.join(presetPath, "trascrizione.txt");
  const transcriptFinalPath = path.join(presetPath, "transcript.json");

  const lines = fs.readFileSync(txtPath, "utf-8")
    .split("\n")
    .filter(line => line.trim())
    .map((line, i) => ({ id: i, start: null, end: null, text: line }));

  fs.writeFileSync(transcriptFinalPath, JSON.stringify({ segments: lines }, null, 2), "utf-8");

  return {
    storyPath: path.join(presetPath, "testo.txt"),
    audioPath: audioPath,
    transcriptPath: transcriptFinalPath
  };
}
