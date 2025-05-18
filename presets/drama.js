export const dramaPreset = {
  name: "drama",
  backgroundPath: "audio/diesirae_binaural_background.mp3", // drama music
  startDelay: 10,
  generation: {
    storyPrompt: (
      transcriptionText,
      language,
    ) => `
    ATTENZIONE: Tutte le istruzioni seguenti sono OBBLIGATORIE.

    DEVI scrivere la microstoria ESCLUSIVAMENTE nella lingua "${language}" (codice ISO). 
    Ignora la lingua di questo prompt, non usare mai l'italiano nelle tue risposte a meno che "${language}" non sia "it".
    NON TRADURRE la storia in nessun'altra lingua, non rispondere mai in italiano o in inglese se non richiesto da "${language}".

    Prendi il testo seguente, che è la trascrizione fedele di una registrazione personale. 
    Riscrivilo come una microstoria intensa, drammatica, tensione alle stelle con sottofondo musicale del Dies Irae come se fosse il momento clou di un film di guerra. Così esagerato tale da far ridere chi ascolta la storia.
    Mantieni rigorosamente ogni dettaglio reale, ma usa uno stile narrativo profondo, con pause, tensione e introspezione. Ispirati ai monologhi interiori nei film di Paolo Sorrentino, Alejandro González Iñárritu o nel film Napoleon. 

    NON aggiungere prefissi come “Ecco la storia” o “Racconto rivisitato”, inizia direttamente la narrazione.

    Scrivi solo la storia, senza alcun commento o spiegazione.

Testo originale:
"""${transcriptionText}"""`,

    voicePrompt: `Affect/personality: You are a stereotypical orc warlord, as seen in fantasy movies and games. Your voice is absurdly deep, guttural, raspy and monstrous, with exaggerated growls and rolling 'R's. You speak in a loud, slow, menacing way, but your delivery is so over-the-top that it's both intimidating and unintentionally funny, like a villain from a fantasy cartoon. Sometimes you add silly orcish noises, grunts, or heavy breathing for dramatic effect.

    Tone: Cinematic, dark, theatrical, and a bit grotesque. Use dramatic pauses, sudden loud outbursts, and an "evil laugh" or snarl at the end of sentences. Don’t be afraid to ham it up—make it sound like an orc who’s trying too hard to be scary.

   Accent: Fake monstrous accent, break words or emphasize syllables in a weird, primitive way, and add classic orcish “ughs” or “grrraah!” between sentences if you want.

    Volume: Booming, echoing, rumbling with thunder.`,

    voice: "ash",
  },

  layers: {
    // 🎙️ Voce utente registrata
    userVoice: {
      volume: -12,
      reverb: {
        decay: 8.0,
        wet: 1.0,
      },
      filter: null,
      automations: [],
      // ⚠️ Mantieni solo uno dei due filtri, o unifica in un array se il tuo sistema li supporta
      filterAutomation: {
        enabled: true,
        type: "lowpass",
        fromHz: 10000,
        toHz: 200,
        startAt: 1,
        endAt: 10,
        curve: "exponential",
      },
      fadeOutAutomation: {
        enabled: true,
        fromGain: 1.0,
        toGain: 0.001,
        startAt: 8,
        endAt: 9.5,
        curve: "linear",
      },
    },

    // 🧠 Voce AI (narratore)
    aiVoice: {
      volume: 0,
      reverb: {
        decay: 3.0,
        wet: 0.3,
      },
      filter: null,
      automations: [],
      filterAutomation: {
        enabled: false,
        type: "lowpass",
        fromHz: 20000,
        toHz: 100,
        startAt: null,
        endAt: null,
        curve: "linear",
      },
      spatialization: {
        enabled: false,
        type: "circular",
        fromAngle: 2,
        toAngle: 2 + 2 * Math.PI,
        radius: 0.05,
        startAtPercentOfAI: 0,
        endAtPercentOfAI: 0.6,
      },
    },

    // 🎶 Sottofondo musicale
    background: {
      volume: -14,
      reverb: {
        decay: 6.5,
        wet: 0.5,
      },
      filter: null,
      automations: [],
      filterAutomation: {
        enabled: false,
        type: "lowpass",
        fromHz: 20000,
        toHz: 300,
        startAtPercentOfAI: 0.4,
        endAtPercentOfAI: 0.6,
        curve: "exponential",
      },
      fadeOutAutomation: {
        enabled: true,
        fromGain: 1.0,
        toGain: 0.001,
        startAtPercentOfAI: 0.9,
        endAtPercentOfAI: 0.95,
        curve: "exponential",
      },
    },
  },
};
