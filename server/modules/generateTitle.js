import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Genera un titolo evocativo (max 5 parole) da una microstoria GPT.
 * Scrive anche un file locale "titolo.txt" dentro la cartella della storia.
 *
 * @param {string} fullStory - Testo narrativo completo generato da GPT
 * @param {string} folderPath - Cartella della storia per salvare il titolo
 * @param {string} model - (opzionale) modello GPT da usare (default: gpt-4)
 * @returns {Promise<string>} - Titolo generato oppure fallback
 */
export async function generateTitleFromStory(fullStory, folderPath, language, model = "gpt-4.1-nano") {
  const prompt = `
Il seguente testo è una microstoria personale.
Genera un titolo evocativo, di massimo 5 parole **nella la lingua "${language}" (codice ISO)**.
Evita virgolette, punti finali o preamboli.


Testo:
${fullStory}

Titolo:
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 20 // 🔐 Massimo spazio per 5 parole
      })
    });

    const data = await response.json();

    // ⚠️ Gestione errore API
    if (!response.ok) {
      console.error("❌ Errore OpenAI nella generazione titolo:", data);
      return "Senza titolo";
    }

    // 🧠 Estrai e pulisci
    const title = data.choices?.[0]?.message?.content?.trim();

    if (!title || title.length < 2) {
      console.warn("⚠️ Titolo GPT vuoto o troppo corto. Uso fallback.");
      return "Senza titolo";
    }

    // 💾 Salva anche in file locale
    const titlePath = path.join(folderPath, "titolo.txt");
    fs.writeFileSync(titlePath, title, "utf-8");

    console.log("🏷️ Titolo salvato:", title);
    return title;

  } catch (err) {
    console.error("❌ Errore nella funzione generateTitleFromStory:", err);
    return "Senza titolo";
  }
}
