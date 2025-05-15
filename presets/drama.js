export const dramaPreset = {
  name: "drama",
  backgroundPath: "audio/diesirae_binaural_background.mp3", // temporale
  startDelay: 11,

  generation: {
    storyPrompt: `Prendi il testo seguente, che è la trascrizione fedele di una registrazione personale. 
    Riscrivilo come una microstoria intensa, drammatica, come se fosse il momento clou di un film. Mantieni rigorosamente ogni dettaglio reale, ma usa uno stile narrativo profondo, con pause, tensione e introspezione. Ispirati ai monologhi interiori nei film di Paolo Sorrentino o Alejandro González Iñárritu. Non aggiungere prefissi come "Ecco la storia" o "Racconto rivisitato", inizia direttamente con la narrazione.

Testo originale:
"""${transcriptionText}"""
    `,

    voicePrompt: `Affect/personality: You're a narrator delivering an emotional monologue filled with tension, melancholy, and gravitas. Let the listener feel the weight of memory.

Tone: Deep, serious, dramatic—each word must resonate as if suspended in air.

Pacing: Slow and deliberate, giving space between sentences to allow the tension to unfold.

Emotion: Rich with internal conflict and gravity. Let the listener perceive unspoken pain, nostalgia, or unresolved tension in your tone.

Pronunciation: Clear, resonant, and cinematic—like a voiceover from an auteur film.

Pause: Strategic pauses at emotional peaks to let each phrase sink in.`,

    voice: "nova" // oppure scegli tu, shimmer o altra più cupa se disponibile
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
        fromAngle: 2,
        toAngle: 2 + 2 * Math.PI,
        radius: 0.05,
        startAtPercentOfAI: 0,
        endAtPercentOfAI: 0.6,
      }
    },

    // 🎶 Sottofondo musicale
    background: {
      volume: -20,
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
      }
    },
  },
};
