import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { createNewStoryFolder, saveFile, saveJSON, deleteStoryFolder } from '../utils/fileManager.js';
import { transcribeAudio } from '../modules/transcribe.js';
import { generateTitleFromStory } from '../modules/generateTitle.js';
import { extractFirst10Seconds } from '../modules/extractVoiceSnippet.js';
import { generateStoryFromPreset } from '../utils/generateStoryFromPreset.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORIES_DIR = path.join(__dirname, '../../stories');

// 🧠 Carica i metadati di una singola storia
function loadMetadata(storyId) {
  const metadataPath = path.join(STORIES_DIR, storyId, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath));
  }
  return null;
}

// 📜 GET /api/stories → elenco di tutte le storie
router.get('/', (req, res) => {
  const stories = fs.readdirSync(STORIES_DIR).filter(name =>
    fs.existsSync(path.join(STORIES_DIR, name, 'metadata.json'))
  );

  const metadataList = stories.map(storyId => {
    const metadata = loadMetadata(storyId);
    return metadata ? { id: storyId, ...metadata } : null;
  }).filter(Boolean);

  res.json(metadataList);
});

// 📘 GET /api/stories/:id/versions → restituisce i preset generati
router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  const storyPath = path.join(STORIES_DIR, id);
  if (!fs.existsSync(storyPath)) {
    return res.status(404).json({ error: 'Storia non trovata' });
  }

  const versions = fs.readdirSync(storyPath)
    .filter(name => name.startsWith("preset_") && fs.existsSync(path.join(storyPath, name, "voce_ai.mp3")))
    .map(name => name.replace("preset_", ""));

  res.json(versions);
});

// 📘 GET /api/stories/:id → dettagli di una singola storia
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const metadata = loadMetadata(id);
  if (!metadata) {
    return res.status(404).json({ error: 'Storia non trovata' });
  }
  res.json(metadata);
});

// 🎤 POST /api/stories → upload nuovo audio + generazione prima versione (dreamy)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file audio ricevuto' });
    }

    console.time("⏱️ TOT → creazione storia");
    const { storyId, folderPath } = createNewStoryFolder();

    // 1. Salva audio .webm
    const originalWebmPath = path.join(folderPath, 'audio_utente.webm');
    saveFile(folderPath, 'audio_utente.webm', req.file.buffer);

    // 2. Trascrive l'audio e prepara il language
    const { text: transcriptionText, language } = await transcribeAudio(originalWebmPath, folderPath);

    // 3. SALVA SUBITO i metadata principali, inclusa la lingua
    //    In questo modo saranno già disponibili per la generazione storia
    const metadata = {
      id: storyId,
      date: new Date().toISOString(),
      preset: 'dreamy',
      duration: null,
      language,
      transcriptionPath: path.join(folderPath, 'trascrizione.txt'),
      audioPath: path.join(folderPath, 'audio_utente.mp3')
    };
    saveJSON(folderPath, 'metadata.json', metadata);

    // 4. Estrai primi 10s della voce utente
    const trimmedPath = path.join(folderPath, 'voce_utente_trimmed.mp3');
    extractFirst10Seconds(originalWebmPath, trimmedPath);

    // 5. Importa preset dreamy (prima versione automatica)
    const { dreamyPreset } = await import("../../presets/dreamy.js");

    // 6. Genera storia completa da preset dreamy
    const result = await generateStoryFromPreset(storyId, dreamyPreset);

    // 7. Genera titolo evocativo nella lingua corretta e aggiorna i metadata
    const storyText = fs.readFileSync(result.storyPath, 'utf-8');

    // 🔑 Recupera la lingua dai metadata salvati
    const meta = JSON.parse(fs.readFileSync(path.join(folderPath, "metadata.json"), "utf-8"));

    // ⚡️ Genera il titolo passando la lingua rilevata
    const title = await generateTitleFromStory(storyText, folderPath, language);

    metadata.title = title; // aggiorna i metadata esistenti
    saveJSON(folderPath, 'metadata.json', metadata);


    console.timeEnd("⏱️ TOT → creazione storia");
    res.status(201).json({ id: storyId });

  } catch (err) {
    console.error("❌ Errore nella creazione della storia:", err);
    console.error("📄 Stack:", err.stack);
    res.status(500).json({ error: 'Errore durante la creazione della storia' });
  }
});

// 🧠 POST /api/stories/:id/generate-version/:presetName → genera una nuova versione basata su preset
router.post('/:id/generate-version/:presetName', async (req, res) => {
  const { id: storyId, presetName } = req.params;

  try {
    const storyPath = path.join(STORIES_DIR, storyId);
    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Storia non trovata' });
    }

    const presetDir = path.join(storyPath, `preset_${presetName}`);
    const audioPath = path.join(presetDir, 'voce_ai.mp3');

    if (fs.existsSync(audioPath)) {
      return res.status(200).json({ message: 'Versione già esistente', alreadyExists: true });
    }

    const { [`${presetName}Preset`]: preset } = await import(`../../presets/${presetName}.js`);
    if (!preset) {
      return res.status(400).json({ error: `Preset "${presetName}" non valido.` });
    }

    const result = await generateStoryFromPreset(storyId, preset);

    res.status(201).json({
      message: 'Versione generata con successo',
      preset: presetName,
      paths: result
    });

  } catch (err) {
    console.error("❌ Errore nella generazione della versione:", err);
    res.status(500).json({ error: 'Errore durante la generazione della versione' });
  }
});


// 🗑️ DELETE /api/stories/:id → elimina una storia
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = deleteStoryFolder(id);
    if (!success) {
      return res.status(404).json({ error: "Storia non trovata" });
    }
    res.json({ success: true, message: "Storia eliminata" });
  } catch (err) {
    console.error("Errore durante eliminazione:", err);
    res.status(500).json({ error: "Errore durante l'eliminazione della storia" });
  }
});


export default router;
