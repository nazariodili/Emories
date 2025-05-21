# 🎧 Emories – README aggiornato (maggio 2025)

> **Ultimo aggiornamento:** 25 maggio 2025  – Fix riverbero library‑samples, preset alignment e prompt narrativi

---

## 🚀 Panoramica

Emories è un’esperienza narrativa audio che prende una tua registrazione, la trasforma in una *microstoria* emozionale narrata da una voce AI e la arricchisce con un mix sonoro cinematografico.

Questo repo contiene **frontend (Vanilla JS + Tone.js)** e **backend (Node + Express)** necessari per registrare, trascrivere, generare, sintetizzare e riprodurre ogni storia.

---

## ✅ Funzionalità chiave

1. **Registrazione utente** (webm → mp3)
2. **Trascrizione Whisper** con rilevamento lingua
3. **Generazione microstoria GPT** (hard‑prompting multilingua)
4. **Sintesi vocale AI** (`voce_ai.mp3`) emozionale
5. **Creazione transcript sincronizzato** (`transcript.json`)
6. **Player multitraccia Tone.js**:

   * 10 s voce utente ➜ 1 s pausa ➜ voce AI (spatializzata) ➜ sottofondo loop
7. **Preset audio** completamente configurabili (volumi, riverberi, filtri, automazioni, panning 3D)
8. **Sync testo↔audio** con evidenziazione riga e scroll fluido
9. **Sound‑library injection**: effetti ambientali (pioggia, scimmia, uccello) inseriti in timeline secondo le parole chiave rilevate nel testo

---

## 🔧 Fix tecnici recenti (v50)

|  #  |  Fix                                                                                                                                     |  File/Modulo                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
|  1  | **Trigger suoni ambientali stabile** – integrazione `findSoundTriggers()`, pre‑load player, `player.sync().start()`                      | `audioEngine.js`, `findSoundTriggers.js`                                    |
|  2  | **Eliminato errore *buffer not loaded*** all’avvio dei sample                                                                            | `audioEngine.js`                                                            |
|  3  | **Avvio sicuro dell’AudioContext**: `Tone.start()` solo dopo gesto utente                                                                | `audioEngine.js`                                                            |
|  4  | **Volume sample** portato a default ‑15 dB                                                                                               | Preset vari                                                                 |
|  5  | **Logging dettagliato** sulla timeline (“⏱️ Schedulato…”)                                                                                | `audioEngine.js`                                                            |
|  6  | **Riverbero library‑samples ora udibile**: rivisto routing wet/dry, default `wet: 0.7`, `decay: 4` se non specificato                    | `audioEngine.js`, presets                                                   |
|  7  | **Preset uniformati**: allineati `dreamy.js`, `drama.js`, `lofi.js` ai nuovi parametri (volume, riverbero, fade‑out automations)         | cartella `presets/`                                                         |
|  8  | **Prompt narrativi migliorati**: più fluidità e varietà per preset *dreamy* e *drama* (inserite frasi di transizione e verbi sensoriali) | `dreamyPreset.generation.storyPrompt`, `dramaPreset.generation.storyPrompt` |

---

## 📁 Struttura progetto

```text
/public
  ├─ index.html
  ├─ story.html                # player
  ├─ record.html               # pagina di registrazione
  ├─ audioEngine.js            # motore di mix
  ├─ syncText.js               # evidenziazione testo
  ├─ presets/
  │    ├─ dreamy.js            # preset esempio
  │    ├─ drama.js             # preset drammatico
  │    └─ …
  └─ audio/library_normalized/ # sound‑library (mp3 normalizzati)
/server
  ├─ index.js                  # Express
  ├─ routes/
  ├─ modules/
  │    ├─ transcribe.js
  │    ├─ generateStory.js
  │    ├─ synthesizeVoice.js
  │    └─ …
  └─ utils/
/stories
  └─ story_<id>/               # cartella per ogni storia generata
```

---

## 📝 Sound‑Library Injection (workflow rapido)

1. **Parsing transcript** → `findSoundTriggers(segments)` restituisce gli hit di parole‑chiave.
2. **Pre‑load player** al setup (scarica buffer in anticipo).
3. **Scheduling sample** con `sync().start(offset)` ➜ sample‑accurate.
4. **Riverbero**: catena dry/wet interna al sample (adesso con `wetGain` 70 %).

### Parametri di mix consigliati

|  Parametro     |  Default |  Note                                |
| -------------- | -------- | ------------------------------------ |
| `volume`       |  ‑15 dB  | sepolto sotto la voce? alza a ‑12 dB |
| `reverb.decay` |  4 s     | max 24 s per suoni atmosferici       |
| `reverb.wet`   |  0.7     | 0.3‑0.8 secondo gusto                |

---

## 🛠 Installazione rapida

```bash
npm install
npm run dev
```

`.env` ➜ `OPENAI_API_KEY=sk‑xxxx…`

---

## 🔮 Roadmap breve

* [ ] **Ducking dinamico**: abbassa sottofondo durante i sample
* [ ] Adattare *tutti* i preset legacy (`fantasy`, `sciFi`, `noir`) al nuovo schema riverbero/volume
* [ ] **Prompt library**: set frasi di apertura/chiusura randomizzate per aumentare varietà
* [ ] Refinement preset *dreamy* / *drama*: riduzione ripetizioni, inserimento verbi sensoriali, coesione narrativa
* [ ] Export **.wav** opzionale (qualità lossless)
* [ ] PWA offline‑ready

---

> *“Le storie non sono nei ricordi, ma nel modo in cui le raccontiamo.”*
