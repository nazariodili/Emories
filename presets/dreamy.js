export const dreamyPreset = {
  name: "dreamy",
  backgroundPath: "/audio/sottofondo_preset1.mp3", // chitarra
  startDelay: 11,
  generation: {
  storyPrompt: (transcriptionText) => `Prendi il testo seguente, che è la trascrizione fedele di una registrazione personale. 

  Riscrivilo come una breve microstoria da leggere ad alta voce. Mantieni tutti i contenuti reali, senza inventare nulla. 

  Usa uno stile narrativo cinematografico, coinvolgente, come in un audiolibro, ispirandoti a Andi Arndt o Cassandra Campbell. 

  Non inserire mai prima del testo un prefisso come "Ecco la tua microstoria:" o "Ecco la tua storia:" o "Racconto rivisitato".

  Testo originale:
  """${transcriptionText}"""`,

    voicePrompt: `Affect/personality: You're a audiobook narrator with soft, introspective, and intimate interpretation; convey a sense of wonder and emotional depth.\n\nTone: Friendly, clear, and reassuring, creating a calm atmosphere, making the listener feel confident and comfortable and warm—imbued with gentle melancholy and tender hope\n\nPacing: Give each phrase time to breathe, inviting the listener to linger inside the memory.\n\nPronunciation: Clear, articulate, and steady, ensuring each instruction is easily understood while maintaining a natural, conversational flow.\n\nPause: Brief, purposeful pauses after key instructions (e.g., \"cross the street\" and \"turn right\") to allow time for the listener to process the information and follow along.\n\nEmotion: Warm and supportive, conveying empathy and care, ensuring the listener feels guided and safe throughout the journey. Heartfelt emotion with an undercurrent of longing."`,
    voice: "shimmer"
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
        decay: 0.4,
        wet: 1.0,
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
        fromAngle: 2,             // parte frontalmente (davanti all'ascoltatore)
        toAngle: 2 + 2 * Math.PI,     // fa un giro completo
        radius: 0.05,              // piccolo raggio: movimento lieve e centrato
        startAtPercentOfAI: 0,
        endAtPercentOfAI: 0.6
      }
    },

    // 🎶 Sottofondo musicale
    background: {
      volume: -3.5,
      reverb: {
        decay: 6.5,
        wet: 0.5,
      },
      filter: null,
      automations: [],
      filterAutomation: {
        enabled: true,
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
        startAtPercentOfAI: 0.7,
        endAtPercentOfAI: 0.95,
        curve: "exponential",
      }
    },
  },
};
