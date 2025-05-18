export const amazonPreset = {
  name: "amazon",
  backgroundPath: "audio/amazon_jungle.mp3", // drama music
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
Riscrivilo come una microstoria emozionante e avventurosa, piena di stupore e meraviglia, ambientata nella giungla.
Mantieni rigorosamente ogni dettaglio reale mantenendo tutti i nomi e i dettagli principali. Se non viene citato chi racconta la storia, prendi questo nome della persona che sta registrando: """Nazario""". 
Usa uno stile narrativo vivace, ricco di dialoghi, descrivi i suoni della giungla e momenti buffi e sorprendenti, come nei racconti per bambini, con un tono allegro e adatto a bambini di 10 anni.
Alla fine della storia, aggiungi sempre una morale o un insegnamento semplice e positivo, ispirato ai fatti raccontati (es. l’importanza dell’amicizia, del rispetto della natura, del coraggio o della gentilezza).

Non aggiungere prefissi come “Ecco la storia” o “Racconto rivisitato”: inizia direttamente la narrazione in terza persona..

Testo originale:
"""${transcriptionText}"""`,

    voicePrompt: `Delivery: Jungle boy, with dramatic pauses, sudden outbursts, and gleeful cackling.

Voice: Eccentric, and slightly unhinged, with a manic enthusiasm that rises and falls unpredictably.

Tone: Excited, chaotic, and grandiose, as if reveling in the brilliance of an adventurous story.

Accent: Childlike, clear, with playful animal imitations and fun “jungle words” (like “whoosh!”, “ee-ee!”, “toot-toot!”) to make the story immersive and funny.`,

    voice: "ballad",
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
        wet: 0.0,
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
      volume: -30,
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
