// audioEngine.js – FIX definitivo 23-05-2025
// Preset dinamici, automazioni exponential, cleanup globale
// 🔄 Correzione principale: uso di findSoundTriggers invece di seg.word

import { findSoundTriggers } from './findSoundTriggers.js';   //  ⬅️ NOVITÀ

// ==================== 🧼 CLEANUP PRECEDENTE ====================
export function destroyPreviousMix() {
  try {
    if (Tone.Transport.state === "started") Tone.Transport.stop();
    Tone.Transport.cancel();

    ["__voceUtente", "__voceAI", "__sottofondo"].forEach((ref) => {
      if (window[ref]) {
        window[ref].dispose?.();
        delete window[ref];
      }
    });

    console.log("🧹 Mix precedente eliminato correttamente.");
  } catch (err) {
    console.warn("⚠️ Errore durante il cleanup del mix:", err);
  }
}

// ==================== 🔁 SETUP NARRAZIONE ====================
export async function setupNarrationSequenceToneJS(
  storyId,
  preset,
  transcript,
) {
  destroyPreviousMix();

  // --- 🎛️ UI --------------------------------------------------
  const playPauseBtn = document.getElementById("playPause");
  const seekBackBtn = document.getElementById("seekBack");
  const seekForwardBtn = document.getElementById("seekForward");
  const timelineSlider = document.getElementById("timelineSlider");
  const currentTimeEl = document.getElementById("currentTime");
  const remainingTimeEl = document.getElementById("remainingTime");
  const presetSelect = document.getElementById("presetSelect");

  if (!playPauseBtn || !seekBackBtn || !seekForwardBtn || !presetSelect) {
    console.error("❌ UI incompleta.");
    return;
  }

  await Tone.start(); // 🔊 Sblocca AudioContext

  // --- 📦 Carica preset se non passato ------------------------
  if (!preset) {
    const presetName = presetSelect?.value || "dreamy";
    const presetModule = await import(`./presets/${presetName}.js`);
    preset = presetModule[`${presetName}Preset`];
  }

  const startDelay = preset.startDelay ?? 0;
  const { userVoice, aiVoice, background } = preset.layers;
  const basePresetPath = `/stories/${storyId}/preset_${preset.name}/`;
  const baseStoryPath = `/stories/${storyId}/`;

  const activeFilters = [];
  let aiDuration = 0;

  // =========== 🎚️ HELPER PER LAYER PLAYER ====================
  async function setupLayerPlayer({ file, startTime, config, loop = false }) {
    const player = new Tone.Player(file);
    player.loop = loop;
    player.fadeIn = 0.2;
    player.fadeOut = 0.2;

    // Volume globale layer (dB → Tone.Volume)
    const finalVolume = new Tone.Volume(config.volume ?? 0).toDestination();

    // Nodo gain per automazioni (valore lineare, default 1.0)
    const autoGain = new Tone.Gain(1);
    let inputNode = player;

    // ----- Filtro statico -------------------------------------
    if (config.filter) {
      const staticFilter = new Tone.Filter(config.filter);
      inputNode.connect(staticFilter);
      inputNode = staticFilter;
    }

    // ----- Filtro dinamico ------------------------------------
    if (config.filterAutomation?.enabled) {
      const filter = new Tone.Filter({
        type: config.filterAutomation.type || "lowpass",
        frequency: config.filterAutomation.fromHz,
        Q: config.filterAutomation.Q ?? 1,
      });
      inputNode.connect(filter);
      inputNode = filter;

      await new Promise((resolve) => {
        if (player.buffer.loaded) return resolve();
        player.buffer.onload = resolve;
      });

      const {
        fromHz,
        toHz,
        duration: autoDuration,
        startAt,
        endAt,
        startAtPercentOfAI,
        endAtPercentOfAI,
        curve = "exponential",
      } = config.filterAutomation;

      activeFilters.push(() => {
        const start =
          startAtPercentOfAI != null
            ? startDelay + aiDuration * startAtPercentOfAI
            : (startAt ?? aiDuration - (autoDuration ?? 2));
        const end =
          endAtPercentOfAI != null
            ? startDelay + aiDuration * endAtPercentOfAI
            : (endAt ?? aiDuration);
        return {
          filter,
          fromHz,
          toHz,
          startAt: startTime + start,
          endAt: startTime + end,
          curve,
          type: "filter",
        };
      });
    }

    // ----- Fade out dinamico (gain) ---------------------------
    if (config.fadeOutAutomation?.enabled) {
      inputNode.connect(autoGain);
      inputNode = autoGain;

      const {
        fromGain,
        toGain,
        duration: autoDuration,
        startAt,
        endAt,
        startAtPercentOfAI,
        endAtPercentOfAI,
        curve = "exponential",
      } = config.fadeOutAutomation;

      activeFilters.push(() => {
        const start =
          startAtPercentOfAI != null
            ? startDelay + aiDuration * startAtPercentOfAI
            : (startAt ?? aiDuration - (autoDuration ?? 2));
        const end =
          endAtPercentOfAI != null
            ? startDelay + aiDuration * endAtPercentOfAI
            : (endAt ?? aiDuration);
        return {
          gainNode: autoGain,
          fromGain,
          toGain,
          startAt: startTime + start,
          endAt: startTime + end,
          curve,
          type: "gain",
        };
      });
    } else {
      inputNode.connect(autoGain);
      inputNode = autoGain;
    }

    // ----- Spatializzazione (3D) ------------------------------
    if (config.spatialization?.enabled) {
      const panner = new Tone.Panner3D({
        panningModel: "HRTF",
        positionX: 1,
        positionY: 0,
        positionZ: 0,
      });
      inputNode.connect(panner);
      inputNode = panner;

      if (config.spatialization.type === "circular") {
        activeFilters.push(() => ({
          type: "spatialCircular",
          panner,
          fromAngle: config.spatialization.fromAngle ?? 0,
          toAngle: config.spatialization.toAngle ?? 2 * Math.PI,
          radius: config.spatialization.radius ?? 1.5,
          startAt: startTime + (config.spatialization.startAt ?? 0),
          endAt: startTime + (config.spatialization.endAt ?? 5),
        }));
      } else {
        activeFilters.push(() => ({
          type: "spatial",
          panner,
          fromX: config.spatialization.fromX,
          toX: config.spatialization.toX,
          startAt: startTime + (config.spatialization.startAt ?? 0),
          endAt: startTime + (config.spatialization.endAt ?? 5),
          curve: config.spatialization.curve ?? "linear",
        }));
      }
    }

    // ----- Riverbero (wet/dry) --------------------------------
    if (config.reverb) {
      // Creiamo wet/dry come per gli altri layer
      const wetGain = new Tone.Gain(config.reverb.wet ?? 0);
      const dryGain = new Tone.Gain(1 - (config.reverb.wet ?? 0));
      const reverb = new Tone.Reverb({ decay: config.reverb.decay });
      await reverb.generate();

      // Dry
      inputNode.connect(dryGain);
      dryGain.connect(finalVolume);
      // Wet
      inputNode.connect(reverb);
      reverb.connect(wetGain);
      wetGain.connect(finalVolume);
    } else {
      inputNode.connect(finalVolume);
    }

    player.sync().start(startTime);
    return player;
  }

  // =========== 🎤 VOCE UTENTE ================================
  const voceUtente = await setupLayerPlayer({
    file: baseStoryPath + "voce_utente_trimmed.mp3",
    startTime: 0,
    config: userVoice,
  });
  window.__voceUtente = voceUtente;

  // =========== 🧠 VOCE AI ====================================
  const voceAI = await setupLayerPlayer({
    file: basePresetPath + "voce_ai.mp3",
    startTime: startDelay,
    config: aiVoice,
  });
  window.__voceAI = voceAI;

  // Assicuriamoci che la traccia sia caricata
  await new Promise((resolve) => {
    if (voceAI.buffer.loaded && voceAI.buffer.duration > 0) return resolve();
    voceAI.buffer.onload = () => {
      if (voceAI.buffer.duration === 0) window.location.reload();
      resolve();
    };
  });

  aiDuration = voceAI.buffer.duration;
  if (aiDuration < 10) {
    console.warn("⚠️ voceAI.duration sospetta. Reload...");
    window.location.reload();
    return;
  }

  // =========== 🎶 SOTTOFONDO ================================
  const sottofondo = await setupLayerPlayer({
    file: preset.backgroundPath,
    startTime: startDelay,
    config: background,
    loop: true,
  });
  window.__sottofondo = sottofondo;

  // ================== 🎧 LIBRARY SAMPLES =====================
  /**
   * Ricava i trigger dal testo (parole chiave nel transcript) e li
   * pianifica sulla Tone.Transport timeline.
   *
   * @param {Array<{start:number,end:number,text:string}>} transcriptSegments
   * @param {Object} preset
   */
  function scheduleTriggeredSounds(transcriptSegments, preset) {
    if (!Array.isArray(transcriptSegments)) return;

    // 1️⃣ estrai i trigger dal testo
    const raw = findSoundTriggers(transcriptSegments); // [{word,file,time}, …]
    if (!raw.length) {
      console.warn("🔇 Nessun trigger nel transcript.");
      return;
    }

    // 2️⃣ istanzia e pre-carica un player per ogni occorrenza
    raw.forEach(({ word, file, time }) => {
      const mix = preset.librarySamples?.[word] ?? {};
      const abs = startDelay + time;         // offset globale 10 s

      // player già in download ora, molto prima del playback
      const player = new Tone.Player(file);
      player.volume.value = mix.volume ?? -15;

      let lastNode = player;
      if (mix.reverb) {
        const rev = new Tone.Reverb({ decay: mix.reverb.decay ?? 4 });
        const wet = new Tone.Gain(mix.reverb.wet ?? 1);
        const dry = new Tone.Gain(1 - (mix.reverb.wet ?? 1));
        player.connect(dry).connect(Tone.Destination);
        player.connect(rev).connect(wet).connect(Tone.Destination);
        lastNode = rev; // (non serve ma chiarisce la chain)
      } else {
        player.toDestination();
      }

      /* 3️⃣ collega al transport e schedula l’avvio */
      player.sync().start(abs);

      console.log(
        `⏱️  Schedulato “${word}” @ ${abs.toFixed(2)} s  (file: ${file})`
      );
    });
  }

  // --- Scheduliamo i suoni ----------------------------------
  if (transcript && Array.isArray(transcript.segments)) {
    scheduleTriggeredSounds(transcript.segments, preset);
  }

  // ================= 🔁 AUTOMAZIONI & TIMELINE ===============
  const mixTail = 4;
  const totalDuration = startDelay + aiDuration + mixTail;
  const resolvedFilters = activeFilters.map((fn) => fn());
  let sottofondoFermato = false;

  Tone.Transport.scheduleRepeat(() => {
    const now = Tone.Transport.seconds;
    timelineSlider.value = now;
    timelineSlider.max = totalDuration;

    // Aggiorna UI tempo
    currentTimeEl.textContent = new Date(now * 1000)
      .toISOString()
      .substr(14, 5);
    remainingTimeEl.textContent =
      "-" +
      new Date(Math.max(0, totalDuration - now) * 1000)
        .toISOString()
        .substr(14, 5);

    // Aggiorna automazioni
    for (const a of resolvedFilters) {
      const p = (now - a.startAt) / (a.endAt - a.startAt);
      const bounded = Math.min(Math.max(p, 0), 1);

      if (a.type === "filter") {
        a.filter.frequency.value =
          a.curve === "linear"
            ? a.fromHz + (a.toHz - a.fromHz) * bounded
            : a.fromHz * Math.pow(a.toHz / a.fromHz, bounded);
      } else if (a.type === "gain") {
        a.gainNode.gain.value =
          a.curve === "linear"
            ? a.fromGain + (a.toGain - a.fromGain) * bounded
            : a.fromGain * Math.pow(a.toGain / a.fromGain, bounded);
      } else if (a.type === "spatial") {
        a.panner.positionX.value =
          a.curve === "linear"
            ? a.fromX + (a.toX - a.fromX) * bounded
            : a.fromX * Math.pow(a.toX / a.fromX, bounded);
      } else if (a.type === "spatialCircular") {
        const angle = a.fromAngle + (a.toAngle - a.fromAngle) * bounded;
        a.panner.positionX.value = Math.cos(angle) * a.radius;
        a.panner.positionZ.value = Math.sin(angle) * a.radius;
      }
    }

    // Ferma sottofondo a fine AI
    if (!sottofondoFermato && now >= startDelay + aiDuration) {
      sottofondo.stop();
      sottofondoFermato = true;
    }
  }, 0.05);

  // =================== FINE AUTO =============================
  Tone.Transport.scheduleOnce(() => {
    Tone.Transport.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
  }, totalDuration);

  // ================= CONTROLLI PLAYER =======================
  let isPlaying = false;
  let pausedAt = 0;

  timelineSlider.addEventListener("input", (e) => {
    const t = parseFloat(e.target.value);
    Tone.Transport.pause();
    Tone.Transport.start("+0.1", t);
    pausedAt = t;
    isPlaying = true;
    playPauseBtn.textContent = "⏸️";
  });

  playPauseBtn.addEventListener("click", async () => {
    if (Tone.context.state !== "running") await Tone.start();
    if (!isPlaying) {
      Tone.Transport.start("+0.1", pausedAt);
      playPauseBtn.textContent = "⏸️";
    } else {
      pausedAt = Tone.Transport.seconds;
      Tone.Transport.pause();
      playPauseBtn.textContent = "▶️";
    }
    isPlaying = !isPlaying;
  });

  seekBackBtn.addEventListener("click", () => {
    const t = Math.max(0, Tone.Transport.seconds - 10);
    Tone.Transport.pause();
    Tone.Transport.start("+0.1", t);
    pausedAt = t;
    isPlaying = true;
    playPauseBtn.textContent = "⏸️";
  });

  seekForwardBtn.addEventListener("click", () => {
    const t = Tone.Transport.seconds + 10;
    Tone.Transport.pause();
    Tone.Transport.start("+0.1", t);
    pausedAt = t;
    isPlaying = true;
    playPauseBtn.textContent = "⏸️";
  });
}
