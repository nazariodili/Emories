    // audioEngine.js con supporto a preset dinamico e funzione di cleanup globale

    // 🧼 Cleanup completo del mix precedente
    export function destroyPreviousMix() {
      try {
        if (Tone.Transport.state === "started") Tone.Transport.stop();
        Tone.Transport.cancel();

        // Dispose dei layer audio globali
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

    // === 🔁 Setup principale per avviare la narrazione
    export async function setupNarrationSequenceToneJS(storyId, preset) {
      // Pulizia del mix precedente
      destroyPreviousMix();

      // === 🎛️ Elementi UI
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

      // === 📦 Se il preset non è passato come argomento, caricalo dal DOM
      if (!preset) {
        const presetName = presetSelect?.value || "dreamy";
        const presetModule = await import(`./presets/${presetName}.js`);
        preset = presetModule[`${presetName}Preset`];
      }

      const startDelay = preset.startDelay ?? 0;
      const { userVoice, aiVoice, background } = preset.layers;
      const basePath = `/stories/${storyId}/`;
      const activeFilters = [];
      let aiDuration = 0;

      // === 🎚️ Funzione helper per configurare un layer audio
      async function setupLayerPlayer({ file, startTime, config, loop = false }) {
        const player = new Tone.Player(file);
        player.loop = loop;
        player.fadeIn = 0.2;
        player.fadeOut = 0.2;

        const finalVolume = new Tone.Volume(config.volume ?? 0).toDestination();
        const dryGain = new Tone.Gain(1);
        let inputNode = player;

        // Filtro statico
        if (config.filter) {
          const staticFilter = new Tone.Filter(config.filter);
          inputNode.connect(staticFilter);
          inputNode = staticFilter;
        }

        // Filtro dinamico
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
            fromHz, toHz, duration: autoDuration,
            startAt, endAt,
            startAtPercentOfAI, endAtPercentOfAI,
            curve = "exponential"
          } = config.filterAutomation;

          activeFilters.push(() => {
            const start = startAtPercentOfAI != null ? startDelay + aiDuration * startAtPercentOfAI : startAt ?? (aiDuration - (autoDuration ?? 2));
            const end = endAtPercentOfAI != null ? startDelay + aiDuration * endAtPercentOfAI : endAt ?? aiDuration;
            return { filter, fromHz, toHz, startAt: startTime + start, endAt: startTime + end, curve, type: "filter" };
          });
        }

        // Fade out dinamico
        if (config.fadeOutAutomation?.enabled) {
          const gainNode = new Tone.Gain(config.fadeOutAutomation.fromGain ?? 1);
          inputNode.connect(gainNode);
          inputNode = gainNode;

          const {
            fromGain, toGain, duration: autoDuration,
            startAt, endAt,
            startAtPercentOfAI, endAtPercentOfAI,
            curve = "linear"
          } = config.fadeOutAutomation;

          activeFilters.push(() => {
            const start = startAtPercentOfAI != null ? startDelay + aiDuration * startAtPercentOfAI : startAt ?? (aiDuration - (autoDuration ?? 2));
            const end = endAtPercentOfAI != null ? startDelay + aiDuration * endAtPercentOfAI : endAt ?? aiDuration;
            return { gainNode, fromGain, toGain, startAt: startTime + start, endAt: startTime + end, curve, type: "gain" };
          });
        }

        // Spatializzazione (3D)
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

        // Riverbero
        if (config.reverb) {
          const wetGain = new Tone.Gain(config.reverb.wet ?? 0);
          const reverb = new Tone.Reverb({ decay: config.reverb.decay });
          await reverb.generate();
          inputNode.connect(reverb);
          reverb.connect(wetGain);
          wetGain.connect(finalVolume);
        }

        inputNode.connect(dryGain);
        dryGain.connect(finalVolume);

        player.sync().start(startTime);
        return player;
      }

      // === 🎤 Voce utente
      const voceUtente = await setupLayerPlayer({
        file: basePath + "voce_utente_trimmed.mp3",
        startTime: 0,
        config: userVoice,
      });
      window.__voceUtente = voceUtente;

      // === 🧠 Voce AI
      const voceAI = await setupLayerPlayer({
        file: basePath + "voce_ai.mp3",
        startTime: startDelay,
        config: aiVoice,
      });
      window.__voceAI = voceAI;

      // Assicurati che sia caricata correttamente
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

      // === 🎶 Sottofondo
      const sottofondo = await setupLayerPlayer({
        file: preset.backgroundPath,
        startTime: startDelay,
        config: background,
        loop: true,
      });
      window.__sottofondo = sottofondo;

      // === 🔁 Automazioni e durata
      const mixTail = 4;
      const totalDuration = startDelay + aiDuration + mixTail;
      const resolvedFilters = activeFilters.map((fn) => fn());
      let sottofondoFermato = false;

      // Loop continuo per applicare automazioni
      Tone.Transport.scheduleRepeat(() => {
        const now = Tone.Transport.seconds;
        timelineSlider.value = now;
        timelineSlider.max = totalDuration;
        currentTimeEl.textContent = new Date(now * 1000).toISOString().substr(14, 5);
        remainingTimeEl.textContent = "-" + new Date(Math.max(0, totalDuration - now) * 1000).toISOString().substr(14, 5);

        for (const a of resolvedFilters) {
          const p = (now - a.startAt) / (a.endAt - a.startAt);
          const bounded = Math.min(Math.max(p, 0), 1);

          if (a.type === "filter") {
            a.filter.frequency.value = a.curve === "linear"
              ? a.fromHz + (a.toHz - a.fromHz) * bounded
              : a.fromHz * Math.pow(a.toHz / a.fromHz, bounded);
          } else if (a.type === "gain") {
            a.gainNode.gain.value = a.curve === "linear"
              ? a.fromGain + (a.toGain - a.fromGain) * bounded
              : a.fromGain * Math.pow(a.toGain / a.fromGain, bounded);
          } else if (a.type === "spatial") {
            a.panner.positionX.value = a.curve === "linear"
              ? a.fromX + (a.toX - a.fromX) * bounded
              : a.fromX * Math.pow(a.toX / a.fromX, bounded);
          } else if (a.type === "spatialCircular") {
            const angle = a.fromAngle + (a.toAngle - a.fromAngle) * bounded;
            a.panner.positionX.value = Math.cos(angle) * a.radius;
            a.panner.positionZ.value = Math.sin(angle) * a.radius;
          }
        }

        if (!sottofondoFermato && now >= startDelay + aiDuration) {
          sottofondo.stop();
          sottofondoFermato = true;
        }
      }, 0.05);

      // Fine automatica
      Tone.Transport.scheduleOnce(() => {
        Tone.Transport.pause();
        isPlaying = false;
        playPauseBtn.textContent = "▶️";
      }, totalDuration);

      // 🎛️ Controlli player
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

      playPauseBtn.addEventListener("click", () => {
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
