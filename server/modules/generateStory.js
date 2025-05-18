import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();



export async function generateNarrativeFrom(
  transcriptionText,
  outputFolderPath,
  model = "gpt-4",
  language,
  customPrompt,
) {
  const prompt =
    customPrompt ||
    `Scrivi: ""Errore di generazione, non ho caricato il preset" nella lingua "${language}" (codice ISO)..

Testo originale:
"""${transcriptionText}"""
`;

  // DEBUG: parametri ricevuti
  console.log(">>> CALL generateNarrativeFrom", {
    transcriptionText,
    outputFolderPath,
    model,
    language,
    customPrompt,
  });
  
  // DEBUG: prompt effettivo
  console.log("🚩 PROMPT FINALE PASSATO A GPT:", prompt);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Sei un narratore che trasforma registrazioni personali in audio storie da ascoltare di max 1minuto w 30 secondi. Inserisci degli elementi che supportano la qualità della lettura dell'audio storia, senza inventare nulla. Se noti degli errori nel testo, correggili (per es: cagnodina correggilo in cagnolina)",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Errore da OpenAI GPT:", data);
    throw new Error(data.error?.message || "Errore sconosciuto");
  }

  // DEBUG: risposta API
  console.log("🔄 RISPOSTA GPT:", data);

  const microstory = data.choices[0].message.content.trim();
  const textPath = path.join(outputFolderPath, "testo.txt");
  fs.writeFileSync(textPath, microstory, "utf-8");

  console.log(
    "📖 Microstoria generata (sintesi):",
    microstory.slice(0, 100) + "...",
  );
  return microstory;
}
