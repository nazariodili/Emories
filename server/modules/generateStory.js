import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * @param {string} transcriptionText - Testo trascritto
 * @param {string} outputFolderPath - Dove salvare "testo.txt"
 * @param {string} model - (facoltativo) Modello GPT da usare
 * @param {string} customPrompt - (facoltativo) Prompt personalizzato da preset
 * @returns {Promise<string>} - Testo della microstoria
 */
export async function generateNarrativeFrom(transcriptionText, outputFolderPath, model = "gpt-4", customPrompt) {
  const prompt = customPrompt || `
Prendi il testo seguente, che è la trascrizione fedele di una registrazione personale.
Riscrivilo come una breve microstoria da leggere ad alta voce.
Mantieni tutti i contenuti reali, senza inventare nulla.
Usa uno stile narrativo cinematografico, coinvolgente, come in un audiolibro, ispirandoti a Andi Arndt o Cassandra Campbell.
Non inserire mai prefissi tipo "Ecco la tua storia:".

Testo originale:
"""${transcriptionText}"""
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Sei un narratore che trasforma registrazioni personali in storie da ascoltare, senza inventare nulla."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Errore da OpenAI GPT:", data);
    throw new Error(data.error?.message || "Errore sconosciuto");
  }

  const microstory = data.choices[0].message.content.trim();
  const textPath = path.join(outputFolderPath, "testo.txt");
  fs.writeFileSync(textPath, microstory, "utf-8");

  console.log("📖 Microstoria generata:", microstory.slice(0, 100) + "...");
  return microstory;
}
