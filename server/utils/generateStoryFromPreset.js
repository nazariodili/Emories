import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateNarrativeFrom } from '../modules/generateStory.js';
import { synthesizeVoiceFromText } from "../modules/synthesizeVoice.js";
import { transcribeAudio } from "../modules/transcribe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera la pipeline di una versione di storia con preset:
 * 1. Prende la trascrizione pura dell'utente (testo.txt)
 * 2. Genera la microstoria tramite il prompt del preset
 * 3. Sintetizza la voce AI della microstoria nella cartella del preset
 * 4. Trascrive la voce AI con Whisper (verbose_json), ottenendo il transcript temporizzato per la sync testo-audio
 * 5. Salva tutti i file nelle giuste cartelle, pronti per il player
 *
 * @param {string} storyId - es. "story_003"
 * @param {object} preset  - oggetto preset con campi .generation.*
 * @returns {Promise<object>} - Path dei file generati { storyPath, audioPath, transcriptPath }
 */
export async function generateStoryFromPreset(storyId, preset) {
  const presetName = preset.name;
  const basePath = path.join(__dirname, "../../stories", storyId);
  const presetPath = path.join(basePath, `preset_${presetName}`);
  if (!fs.existsSync(presetPath)) fs.mkdirSync(presetPath, { recursive: true });

  // DEBUG 1: stampa dove siamo
  console.log("\n=== [generateStoryFromPreset] ===");
  console.log("basePath:", basePath);
  console.log("presetPath:", presetPath);

  // 1. Trascrizione originale dell'utente
  const transcriptTxtPath = path.join(basePath, "trascrizione.txt");
  if (!fs.existsSync(transcriptTxtPath)) {
    throw new Error("❌ trascrizione.txt mancante: impossibile generare la storia.");
  }
  const originalText = fs.readFileSync(transcriptTxtPath, "utf-8").trim();
  console.log("📄 Trascrizione utente (input a GPT):");
  console.log(originalText);

  // 2. Genera la microstoria con GPT
  let storyText;
  try {
    const promptReady = preset.generation.storyPrompt(originalText);
    storyText = await generateNarrativeFrom(
      originalText,
      presetPath,
      "gpt-4o-mini",
      promptReady
    );

    console.log("📚 Microstoria generata (inizio):", storyText.slice(0, 200));
  } catch (err) {
    console.error("❌ Errore nella generazione della microstoria:", err);
    throw err;
  }
  const storyPath = path.join(presetPath, "testo.txt");
  fs.writeFileSync(storyPath, storyText, "utf-8");

  // 3. Sintesi vocale AI
  try {
    await synthesizeVoiceFromText(
      storyText,
      presetPath,
      preset.generation
    );
  } catch (err) {
    console.error("❌ Errore nella sintesi vocale:", err);
    throw err;
  }
  const audioPath = path.join(presetPath, "voce_ai.mp3");

  // 4. Trascrizione Voce AI con Whisper
  let aiTranscript;
  try {
    const tResult = await transcribeAudio(audioPath, presetPath);
    aiTranscript = tResult.transcript;
    if (!aiTranscript || !aiTranscript.segments || !Array.isArray(aiTranscript.segments)) {
      console.error("❌ Transcript AI mancante o non valido:", aiTranscript);
      throw new Error("Transcript AI mancante o non valido (nessun segmento temporizzato ricevuto)");
    }
    console.log("📑 Transcript AI (primi segmenti):", aiTranscript.segments.slice(0, 3));
  } catch (err) {
    console.error("❌ Errore nella trascrizione AI:", err);
    throw err;
  }

  // 5. Salvataggi
  const transcriptFinalPath = path.join(presetPath, "transcript.json");
  fs.writeFileSync(transcriptFinalPath, JSON.stringify(aiTranscript, null, 2), "utf-8");
  // anche solo testo (opzionale, debug/retrocompatibilità)
  fs.writeFileSync(
    path.join(presetPath, "trascrizione.txt"),
    aiTranscript.segments.map(s => s.text).join('\n'),
    "utf-8"
  );

  // 6. Output path
  return {
    storyPath: storyPath,
    audioPath: audioPath,
    transcriptPath: transcriptFinalPath
  };
}
