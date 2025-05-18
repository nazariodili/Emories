import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORIES_DIR = path.join(__dirname, '../../stories');

// ✅ Crea nuova cartella story_XXX con numerazione sempre crescente (no riuso buchi)
export function createNewStoryFolder() {
  if (!fs.existsSync(STORIES_DIR)) {
    fs.mkdirSync(STORIES_DIR, { recursive: true });
  }

  // Trova tutti i numeri delle cartelle esistenti (es: story_001 → 1)
  const existing = fs.readdirSync(STORIES_DIR)
    .filter(name => name.startsWith('story_'))
    .map(name => parseInt(name.replace('story_', ''), 10))
    .filter(num => !isNaN(num));

  // Calcola il nuovo numero: se nessuna cartella, parti da 1. Altrimenti, max + 1
  const newNum = existing.length === 0 ? 1 : Math.max(...existing) + 1;
  const newId = String(newNum).padStart(3, '0');
  const storyId = `story_${newId}`;
  const folderPath = path.join(STORIES_DIR, storyId);

  // Se la cartella esiste già, lancia errore (teoricamente impossibile)
  if (fs.existsSync(folderPath)) {
    throw new Error(`La cartella ${folderPath} esiste già!`);
  }

  fs.mkdirSync(folderPath);
  return { storyId, folderPath };
}

// 💾 Salva un file generico in una cartella
export function saveFile(folderPath, fileName, buffer) {
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, buffer);
}

// 💾 Salva un oggetto JSON
export function saveJSON(folderPath, fileName, obj) {
  const jsonPath = path.join(folderPath, fileName);
  fs.writeFileSync(jsonPath, JSON.stringify(obj, null, 2), 'utf-8');
}

// 📖 Leggi un JSON (utility comoda per dopo)
export function readJSON(folderPath, fileName) {
  const filePath = path.join(folderPath, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// 📦 Leggi tutti i preset disponibili nella cartella public/presets
export function getAvailablePresets() {
  const presetsDir = path.join(__dirname, '../../presets');

  if (!fs.existsSync(presetsDir)) return [];

  const files = fs.readdirSync(presetsDir);
  return files
    .filter(name => name.endsWith('.js'))
    .map(name => path.basename(name, '.js'));
}

// 🗑️ Elimina l'intera cartella di una storia (ricorsivo)
export function deleteStoryFolder(storyId) {
  const folderPath = path.join(STORIES_DIR, storyId);
  if (!fs.existsSync(folderPath)) return false;

  // Funzione ricorsiva di eliminazione
  function deleteRecursive(curPath) {
    if (fs.lstatSync(curPath).isDirectory()) {
      fs.readdirSync(curPath).forEach(file => {
        const entryPath = path.join(curPath, file);
        deleteRecursive(entryPath);
      });
      fs.rmdirSync(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  }
  deleteRecursive(folderPath);
  return true;
}
