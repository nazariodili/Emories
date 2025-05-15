// public/syncText.js

/**
 * Sincronizza il testo con l’audio (Tone.js), centrando la riga attiva
 * con scroll fluido personalizzato ed evidenziazione visiva.
 *
 * @param {string} containerId - ID del contenitore HTML che mostra il testo
 * @param {Array} transcript - Lista di segmenti con { text, start, end }
 * @param {number} offsetSeconds - Offset temporale (es. ritardo TTS)
 */
export function setupSyncText(containerId, transcript, offsetSeconds = 0) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // 🔤 Crea gli <span> per ogni riga del transcript
  transcript.forEach((segment) => {
    const span = document.createElement("span");
    span.textContent = segment.text;
    span.dataset.start = segment.start;
    span.dataset.end = segment.end;
    span.classList.add("block", "mb-4");
    container.appendChild(span);
  });

  // 🧹 Scroll iniziale a 0
  container.scrollTop = 0;

  let lastActiveSpan = null;

  /**
   * Easing "easeInOutQuad" per scroll fluido
   */
  function easeInOutQuad(t) {
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t;
  }

  /**
   * Scroll fluido animato con easing personalizzato
   */
  function animateScroll(container, target, duration = 700) {
    const start = container.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);
      container.scrollTop = start + change * eased;

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Evidenziazione e scroll sincronizzati con Tone.Transport
   */
  function highlight() {
    if (Tone.Transport.state !== "started") {
      requestAnimationFrame(highlight);
      return;
    }

    const now = Tone.Transport.seconds - offsetSeconds;
    const spans = container.querySelectorAll("span");
    let activeSpan = null;

    spans.forEach((el) => {
      const start = parseFloat(el.dataset.start);
      const end = parseFloat(el.dataset.end);
      const isActive = now >= start && now < end;
      el.classList.toggle("bg-yellow-200", isActive);
      if (isActive) activeSpan = el;
    });

    if (
      activeSpan &&
      activeSpan !== lastActiveSpan &&
      container.scrollHeight > container.clientHeight
    ) {
      // 🧠 Calcolo posizione reale del centro della riga attiva rispetto al contenitore
      const spanRect = activeSpan.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const spanMid = spanRect.top + spanRect.height / 2;
      const containerMid = containerRect.top + containerRect.height / 2;

      const scrollOffset = spanMid - containerMid;
      const targetScroll = container.scrollTop + scrollOffset;

      // ✨ Scroll ultra-smooth
      animateScroll(container, targetScroll, 700);

      lastActiveSpan = activeSpan;
    }

    requestAnimationFrame(highlight);
  }

  // ⏳ Aspetta che il layout sia pronto prima di avviare la sincronizzazione
  setTimeout(() => {
    requestAnimationFrame(highlight);
  }, 300);
}
