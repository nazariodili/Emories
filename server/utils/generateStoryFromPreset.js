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
 * 2. Genera la microstoria tramite il prompt del preset, ora basato sulla lingua rilevata
 * 3. Sintetizza la voce AI della microstoria nella cartella del preset
 * 4. Trascrive la voce AI con Whisper (verbose_json), ottenendo il transcript temporizzato per la sync testo-audio
 * 5. Salva tutti i file nelle giuste cartelle, pronti per il player
 *
 * @param {string} storyId - es. "story_003"
 * @param {object} preset  - oggetto preset con campo .generation.storyPrompt()
 * @returns {Promise<object>} - Path dei file generati { storyPath, audioPath, transcriptPath }
 */
export async function generateStoryFromPreset(storyId, preset) {
  const presetName = preset.name;
  const basePath = path.join(__dirname, "../../stories", storyId);
  const presetPath = path.join(basePath, `preset_${presetName}`);
  if (!fs.existsSync(presetPath)) fs.mkdirSync(presetPath, { recursive: true });

  // === DEBUG: log percorso lavoro
  console.log("\n=== [generateStoryFromPreset] ===");
  console.log("basePath:", basePath);
  console.log("presetPath:", presetPath);

  // === STEP 1: Prendi la lingua dal metadata della storia
  const metadataPath = path.join(basePath, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    throw new Error("❌ metadata.json mancante: impossibile determinare la lingua della storia.");
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  const language = metadata.language || "it"; // fallback: italiano

  // === STEP 2: Carica trascrizione originale dell'utente
  const transcriptTxtPath = metadata.transcriptionPath || path.join(basePath, "trascrizione.txt");
  if (!fs.existsSync(transcriptTxtPath)) {
    throw new Error("❌ trascrizione.txt mancante: impossibile generare la storia.");
  }
  const originalText = fs.readFileSync(transcriptTxtPath, "utf-8").trim();
  console.log("📄 Trascrizione utente (input a GPT):");
  console.log(originalText);

  // === STEP 3: Genera la microstoria con GPT usando il prompt multilingua del preset
  let storyText;
  try {
    // Usa la funzione storyPrompt del preset, che ora riceve anche la lingua
    const promptReady = preset.generation.storyPrompt(originalText, language);

    // Passa il prompt e la lingua alla funzione che chiama GPT
    storyText = await generateNarrativeFrom(
      originalText,    // testo trascritto dall'utente
      presetPath,      // dove salvare la storia
      "gpt-4o-mini",   // modello da usare
      language,        // lingua ISO, es. "it", "en"
      promptReady      // prompt specifico del preset e della lingua
    );

    console.log("📚 Microstoria generata (inizio):", storyText.slice(0, 200));
  } catch (err) {
    console.error("❌ Errore nella generazione della microstoria:", err);
    throw err;
  }
  const storyPath = path.join(presetPath, "testo.txt");
  fs.writeFileSync(storyPath, storyText, "utf-8");

  // === STEP 4: Sintesi vocale AI della microstoria
  try {
    // Passa la storia, cartella di output e i parametri del preset
    await synthesizeVoiceFromText(
      storyText,
      presetPath,
      preset.generation // Passa oggetto preset.generation (può includere voice e instructions custom)
    );
  } catch (err) {
    console.error("❌ Errore nella sintesi vocale:", err);
    throw err;
  }
  const audioPath = path.join(presetPath, "voce_ai.mp3");

  // === STEP 5: Trascrivi la voce AI con Whisper per ottenere transcript temporizzato
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

  // === STEP 6: Salvataggi finali
  const transcriptFinalPath = path.join(presetPath, "transcript.json");
  fs.writeFileSync(transcriptFinalPath, JSON.stringify(aiTranscript, null, 2), "utf-8");
  // (Opzionale) salva anche il solo testo lineare
  fs.writeFileSync(
    path.join(presetPath, "trascrizione.txt"),
    aiTranscript.segments.map(s => s.text).join('\n'),
    "utf-8"
  );

  // === STEP 7: Output path dei file generati
  return {
    storyPath: storyPath,
    audioPath: audioPath,
    transcriptPath: transcriptFinalPath
  };
}
