import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Genera una microstoria narrativa da una trascrizione vocale.
 * Salva il risultato in "testo.txt" nella cartella della storia.
 * 
 * @param {string} transcriptionText - Il testo trascritto (grezzo)
 * @param {string} outputFolderPath - Dove salvare la microstoria
 * @param {string} model - (facoltativo) Modello GPT da usare
 * @returns {Promise<string>} - Testo della microstoria
 */
export async function generateNarrativeFrom(transcriptionText, outputFolderPath, model = "gpt-4") {
  const prompt = `
Prendi il testo seguente, che è la trascrizione fedele di una registrazione personale.
Riscrivilo come una breve microstoria da leggere ad alta voce.
Mantieni tutti i contenuti reali, senza inventare nulla.
Usa uno stile narrativo cinematografico, coinvolgente, come in un audiolibro, ispirandoti a Andi Arndt o Cassandra Campbell.

Non inserire mai prima del testo un prefisso come "Ecco la tua microstoria:" o "Ecco la tua storia:" o "Racconto rivisitato"

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
          content: "Sei un narratore che trasforma registrazioni personali in narrazione da ascolto ricca di emozioni vere, non finte o forza. Non devi inventare nulla."
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
  console.log("📖 Microstoria GPT generata:", microstory.slice(0, 100) + "...");

  // 💾 Salva anche in file locale
  const textPath = path.join(outputFolderPath, "testo.txt");
  fs.writeFileSync(textPath, microstory, "utf-8");
  console.log(`💾 Microstoria salvata in ${textPath}`);

  return microstory;
}
