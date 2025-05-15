import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

// 🧩 Importa utility e moduli interni
import { createNewStoryFolder, saveFile, saveJSON } from '../utils/fileManager.js';
import { transcribeAudio } from '../modules/transcribe.js';
import { generateNarrativeFrom } from '../modules/generateStory.js';
import { synthesizeVoiceFromText } from '../modules/synthesizeVoice.js';
import { generateTranscriptFromAudio } from '../modules/generateTranscriptFromAudio.js';
import { extractFirst10Seconds } from '../modules/extractVoiceSnippet.js';
import { generateTitleFromStory } from '../modules/generateTitle.js'; // 🆕 modulo per titolo GPT

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

// 📜 GET /api/stories → restituisce elenco di tutte le storie disponibili
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

// 📘 GET /api/stories/:id → dettagli di una storia specifica
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const metadata = loadMetadata(id);
  if (!metadata) {
    return res.status(404).json({ error: 'Storia non trovata' });
  }

  res.json(metadata);
});

// 🎤 Configura upload audio utente via multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🛠️ POST /api/stories → genera una nuova storia completa
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file audio ricevuto' });
    }

    console.time("⏱️ TOT → creazione storia");

    // 📁 1. Crea una nuova cartella per la storia
    console.time("📁 Crea cartella storia");
    const { storyId, folderPath } = createNewStoryFolder();
    console.timeEnd("📁 Crea cartella storia");

    // 💾 2. Salva il file audio .webm
    console.time("💾 Salva audio .webm");
    const originalWebmPath = path.join(folderPath, 'audio_utente.webm');
    saveFile(folderPath, 'audio_utente.webm', req.file.buffer);
    console.timeEnd("💾 Salva audio .webm");

    // 📝 3. Trascrive il contenuto
    console.time("📝 Trascrizione");
    const { text: transcriptionText, convertedPath } = await transcribeAudio(originalWebmPath, folderPath);
    console.timeEnd("📝 Trascrizione");

    // ✂️ 4. Estrai primi 10s (voce utente trimmed)
    console.time("✂️ Trim primi 10s");
    const trimmedPath = path.join(folderPath, 'voce_utente_trimmed.mp3');
    extractFirst10Seconds(originalWebmPath, trimmedPath);
    console.log("✅ Trim completato:", fs.existsSync(trimmedPath), trimmedPath);
    console.timeEnd("✂️ Trim primi 10s");

    // 🧠 5. Genera microstoria
    console.time("📖 Genera microstoria GPT");
    const microstory = await generateNarrativeFrom(transcriptionText, folderPath);
    console.timeEnd("📖 Genera microstoria GPT");

    // 🏷️ 6. Genera titolo evocativo
    console.time("🏷️ Genera titolo");
    const title = await generateTitleFromStory(microstory, folderPath);
    console.log("📝 Titolo generato:", title);
    console.timeEnd("🏷️ Genera titolo");

    // 🗣️ 7. Sintesi voce AI
    console.time("🗣️ Sintetizza voce AI");
    const voceAIPath = await synthesizeVoiceFromText(microstory, folderPath);
    console.timeEnd("🗣️ Sintetizza voce AI");

    // ⏱️ 8. Trascrizione sincronizzata
    console.time("⏱️ Transcript sincronizzato");
    await generateTranscriptFromAudio(voceAIPath, folderPath);
    console.timeEnd("⏱️ Transcript sincronizzato");

    // 📄 9. Scrive metadata
    console.time("💾 Salva metadata");
    const metadata = {
      id: storyId,
      title,
      date: new Date().toISOString(),
      preset: 'dreamy',
      duration: null
    };
    saveJSON(folderPath, 'metadata.json', metadata);
    console.timeEnd("💾 Salva metadata");

    console.timeEnd("⏱️ TOT → creazione storia");

    res.status(201).json({ id: storyId });

  } catch (err) {
    console.error("❌ Errore nella creazione della storia:", err);
    res.status(500).json({ error: 'Errore durante la creazione della storia' });
  }
});


export default router;
