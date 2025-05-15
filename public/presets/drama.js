export const dreamyPreset = {
  name: "dreamy",
  backgroundPath: "audio/dies_irae_binaural_background.mp3", // temporale
  startDelay: 11,

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
        type: "highpass",
        fromHz: 500,
        toHz: 600,
        startAt: 1,
        endAt: 10,
        curve: "linear",
      },
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
        enabled: true,
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
