# 🎧 Emories – README aggiornato (maggio 2025)

Questa versione aggiornata dell'app **Emories multistoria** supporta:

- registrazione e generazione autonoma di ogni storia
- voce AI narrante con mix audio dinamico (voce utente + AI + sottofondo)
- preset audio selezionabili
- timeline interattiva + evidenziazione testo sincronizzata
- effetto **binaurale simulato** sulla voce AI (spatializzazione circolare)
- sottofondo audio compatibile con **audio binaurale**
- prompt ottimizzato per **voce narrante emozionale** tramite `synthesizeVoice.js`

---

## ✅ Funzionalità principali

1. **Registrazione audio** (voce utente)
2. **Trascrizione automatica** con OpenAI Whisper
3. **Generazione microstoria** narrativa con GPT
4. **Sintesi vocale AI** della microstoria (`voce_ai.mp3`)
   - tramite `synthesizeVoice.js` con `instructions` ottimizzate per ottenere una narrazione emozionale e immersiva
5. **Estrazione transcript sincronizzato** (`transcript.json`)
6. **Player narrativo multitraccia** con Tone.js:
   - 10s voce utente
   - 1s pausa
   - voce AI narrante (con panning 3D)
   - sottofondo binaurale in loop
7. **Preset audio** dinamici:
   - controlli separati per voce utente, AI e sottofondo
   - filtro lowpass, riverbero, volumi, automazioni
   - spatializzazione circolare della voce AI con `Panner3D`
8. **Testo sincronizzato**:
   - scroll e highlight riga per riga
   - scroll centrato solo quando la riga attiva supera la metà visibile
   - centramento fluido sia avanti che indietro

---

## 🔧 Fix tecnici recenti

### ✅Generaione storie multi preset
- Bug da risolvere:
  - Accertarsi che dal file del preset viene mandata la trascrizione della voce registrata: Sembra che il preset drama sia sconnesso. Probabilmente anche il preset dreamy -> Credo che il fallback dentro il generateStory faccia si che la storia di dreamy sia coerente con la registrazione, ma non il preset.


### ✅ Scroll sincronizzato perfetto
- Scroll centrato **solo se la riga attiva cambia**
- Funziona **sia avanti che indietro** nella timeline
- Usa `getBoundingClientRect()` per calcolo preciso
- Scorrimento morbido personalizzato (`easeInOutQuad`)

### ✅ Aggiunta spatializzazione AI
- Effetto binaurale ottenuto tramite `Tone.Panner3D` (HRTF)
- Movimento circolare controllato da preset (startAngle, endAngle, radius)

### ✅ Prompt ottimizzato per TTS
- File `synthesizeVoice.js` include ora `instructions` dettagliate:
  > "You're an audiobook narrator with soft, introspective, and intimate interpretation; convey a sense of wonder and emotional depth..."

---

## 📁 Struttura cartelle

```
/public/
  index.html
  story.html
  registrazione.html
  presets/dreamy.js
  audioEngine.js
  syncText.js

/server/
  index.js
  routes/storyRoutes.js
  modules/
    transcribe.js
    generateStory.js
    synthesizeVoice.js
    generateTranscriptFromAudio.js
    extractVoiceSnippet.js
  utils/fileManager.js

/stories/
  story_001/
    audio_utente.webm
    voce_utente_trimmed.mp3
    voce_ai.mp3
    transcript.json
    metadata.json
```

---

## 📦 Prossimi passi

- [x] Aggiunta spazializzazione della voce AI
- [x] Prompt ottimizzato per voce narrante emozionale
- [x] Supporto a background binaurali
- [ ] Accertarsi che dal file del preset viene mandata la trascrizione della voce registrata: Sembra che il preset drama sia sconnesso. Probabilmente anche il preset dreamy -> Credo che il fallback dentro il generateStory faccia si che la storia di dreamy sia coerente con la registrazione, ma non il preset.
- [ ] Il text sync non funziona perchè nel transcript non vengono separati i segments -> basarsi su logiche di funzionanmento precedente 
- [ ] Migliorare la voce registrata da utente
- [ ] Migliorare narrazione e testo generato
- [ ] Aumentare l’effetto emozionale dell’esperienza audio
- [ ] Creare un nuovo preset alternativo
- [ ] Ottimizzare performance complessive

---

## 💬 Prompt per riprendere la conversazione

```
Sto lavorando a Emories, un'app per creare esperienze audio narrative personalizzate. Abbiamo già implementato la registrazione, la trascrizione, la generazione di una microstoria e il mix audio narrato con voce AI. Ora il sistema sincronizza perfettamente il testo con lo scroll, ed è possibile selezionare preset audio con effetti binaurali e narrazione emozionale.

Prossimi obiettivi: migliorare la qualità emotiva della voce utente, arricchire la storia generata e introdurre nuovi preset immersivi. Aiutami a proseguire con questi obiettivi.
```

---

## 🛠 Requisiti per installazione su Replit

1. Crea un nuovo progetto **Node.js** su Replit
2. Carica tutti i file del progetto (es. ZIP completo)
3. Installa le dipendenze:

```
npm install express openai node-fetch formidable
```

4. Verifica che esista un file `.env` con la tua chiave:

```
OPENAI_API_KEY=sk-xxxxxxxx
```

5. Avvia il progetto:

```
npm start
```

6. Visita l’URL generato da Replit per usare l’app

---

Buona narrazione! 🌙
