// public/record.js
export function setupRecorder(startBtnId, stopBtnId, onComplete) {
  let mediaRecorder;
  let audioChunks = [];

  document.getElementById(startBtnId).addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      onComplete(audioBlob);
    };

    mediaRecorder.start();
    console.log("🔴 Registrazione iniziata...");
  });

  document.getElementById(stopBtnId).addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      console.log("⏹️ Registrazione terminata.");
    }
  });
}
