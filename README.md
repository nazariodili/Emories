
# 🎧 Emories – README aggiornato (maggio 2025)

Questa versione aggiornata dell'app **Emories multistoria** supporta:

- registrazione e generazione autonoma di ogni storia
- voce AI narrante con mix audio dinamico (voce utente + AI + sottofondo)
- preset audio selezionabili
- timeline interattiva + evidenziazione testo sincronizzata
- effetto **binaurale simulato** sulla voce AI (spatializzazione circolare)
- sottofondo audio compatibile con **audio binaurale**
- prompt ottimizzato per **voce narrante emozionale** tramite `synthesizeVoice.js`
- **hard prompting multilingua**: la lingua della microstoria e del titolo è ora forzata tramite istruzioni forti all’inizio, nel mezzo e in fondo al prompt, garantendo la corretta generazione nella lingua della registrazione (vedi dettagli sotto)

---

## ✅ Funzionalità principali

1. **Registrazione audio** (voce utente)
2. **Trascrizione automatica** con OpenAI Whisper (con rilevamento lingua)
3. **Generazione microstoria** narrativa con GPT (prompt dinamico, hard prompting lingua)
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
9. **Hard prompting multilingua**:
   - Il prompt passato a GPT, sia per la storia che per il titolo, include istruzioni forti, ridondanti e imperative per obbligare il modello a generare **sempre** nella lingua della registrazione.
   - Vengono specificati comportamenti “critici” in caso di risposta nella lingua sbagliata.
   - Il prompt ripete la richiesta di lingua più volte, sia all’inizio che alla fine, e spiega chiaramente cosa NON fare (ad esempio, non usare l’italiano se la lingua è inglese, ecc.).

---

## 🔧 Fix tecnici recenti

### ✅ Hard prompting multilingua nei preset
- Tutti i preset adottano prompt “imperativi” che forzano GPT a scrivere la microstoria nella lingua della registrazione.
- Anche la generazione dei titoli usa ora la stessa logica, garantendo titoli evocativi e localizzati nella lingua giusta.

### ✅ Generazione storie multi-preset
- Prompt dinamico per ogni preset, injection della lingua, bug fixed per la coerenza tra storia generata e lingua della registrazione.

### ✅ Scroll sincronizzato perfetto
- Scroll centrato **solo se la riga attiva cambia**
- Funziona sia avanti che indietro nella timeline
- Usa `getBoundingClientRect()` per calcolo preciso
- Scorrimento morbido personalizzato (`easeInOutQuad`)

### ✅ Aggiunta spatializzazione AI
- Effetto binaurale tramite `Tone.Panner3D` (HRTF)
- Movimento circolare controllato da preset (startAngle, endAngle, radius)

### ✅ Prompt ottimizzato per TTS
- Il file `synthesizeVoice.js` ora include istruzioni dettagliate per voce emozionale.

---

## 📁 Struttura cartelle

```
/public/
   index.html
   story.html
   registrazione.html
   record.js
   audioEngine.js
   syncText.js

/server/
   index.js
   routes/storyRoutes.js
   modules/
      transcribe.js
      generateStory.js
      generateTitle.js
      synthesizeVoice.js
      generateTranscriptFromAudio.js
      extractVoiceSnippet.js
   utils/
      fileManager.js
      generateStoryFromPreset.js

/presets/
   dreamy.js
   drama.js

/stories/
   story_001/
      preset_dreamy/
         testo.txt
         transcript.json
         trascrizione.txt
         voce_ai.mp3
      audio_utente.webm
      audio_utente.mp3
      voce_utente_trimmed.mp3
      transcript.json
      metadata.json
      titolo.txt
      trascrizione.txt
```

---

## 📦 Prossimi passi

- [ ] **Injection nel mix di suoni basata sui timestamp della trascrizione:**  
      Aggiungere la possibilità di inserire automaticamente suoni (da una sound library) nel mix audio in corrispondenza di specifici timestamp rilevati dalla transcript.  
      - Dovrà essere gestita la **probabilità di injection** di ciascun suono (es: non sempre lo stesso suono ogni volta che ricorre un trigger).
      - Bisognerà garantire la coerenza del mix: quando viene iniettato un suono, il volume del sottofondo del preset va abbassato in modo proporzionale per non sovrapporre troppo i layer.
      - Logging e debug sulle injection e test di comportamento per evitare conflitti tra suoni ed effetti audio già presenti.
- [ ] Agigungere il nome della persona loggata per inject dentro il prompt per storie in terza persona, altrimenti il GPT è costretto ad inventare nomi
- [ ] Migliorare la voce registrata da utente
- [ ] Migliorare narrazione e testo generato
- [ ] Aumentare l’effetto emozionale dell’esperienza audio
- [ ] Creare nuovi preset alternativi (ASMR, docu, drama...)
- [ ] Ottimizzare performance complessive

---

## 💬 Prompt per riprendere la conversazione

```
Sto lavorando a Emories, un'app per creare esperienze audio narrative personalizzate. Ora i prompt per GPT (storia e titolo) usano hard prompting per forzare la lingua della registrazione e garantire risultati localizzati. 
Prossimi obiettivi: injection dinamica di suoni su timestamp dal transcript, miglioramento qualità emotiva della voce utente e nuovi preset audio immersivi. 
Aiutami a proseguire con questi obiettivi.
```

---

## 🛠 Requisiti per installazione su Replit

1. Crea un nuovo progetto **Node.js** su Replit
2. Carica tutti i file del progetto (es. ZIP completo)
3. Installa le dipendenze:

   ```
   npm install express openai node-fetch formidable
   ```

4. Verifica che esista un file `.env` con la tua chiave OpenAI:

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
