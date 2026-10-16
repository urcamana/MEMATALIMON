(() => {
  const $ = (s) => document.querySelector(s);
  let audioCtx = null;
  let osc = null, gain = null, merger = null, lGain = null, rGain = null;

  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function stopTone() {
    try { osc?.stop(); } catch (_) {}
    try { osc?.disconnect(); } catch (_) {}
    try { gain?.disconnect(); } catch (_) {}
    try { lGain?.disconnect(); } catch (_) {}
    try { rGain?.disconnect(); } catch (_) {}
    try { merger?.disconnect(); } catch (_) {}
    osc = gain = merger = lGain = rGain = null;
  }

  function playChannel(mode) {
    // mode: 'l' | 'r' | 'both'
    stopTone();
    const ac = ctx();
    if (ac.state === 'suspended') ac.resume();
    osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain = ac.createGain();
    gain.gain.value = 0.15;
    merger = ac.createChannelMerger(2);
    lGain = ac.createGain();
    rGain = ac.createGain();
    lGain.gain.value = mode === 'r' ? 0 : 1;
    rGain.gain.value = mode === 'l' ? 0 : 1;
    osc.connect(gain);
    gain.connect(lGain);
    gain.connect(rGain);
    lGain.connect(merger, 0, 0);
    rGain.connect(merger, 0, 1);
    merger.connect(ac.destination);
    osc.start();
    setTimeout(stopTone, 1500);
  }

  $('#btn-l').onclick = () => playChannel('l');
  $('#btn-r').onclick = () => playChannel('r');
  $('#btn-both').onclick = () => playChannel('both');
  $('#btn-stop-tone').onclick = stopTone;

  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.classList.toggle('bg-white', !on);
        b.classList.toggle('border', !on);
        b.classList.toggle('border-primary/20', !on);
        b.classList.toggle('font-semibold', on);
        b.classList.toggle('font-medium', !on);
      });
      const mic = btn.dataset.tab === 'mic';
      $('#panel-phones').classList.toggle('hidden', mic);
      $('#panel-mic').classList.toggle('hidden', !mic);
      stopTone();
    };
  });

  // Mic
  let mediaStream = null, mediaRecorder = null, chunks = [], anim = null, analyser = null;

  function setRecUI(recording) {
    $('#btn-rec').disabled = recording;
    $('#btn-stop-rec').disabled = !recording;
    $('#rec-status').textContent = recording ? 'Grabando…' : 'Listo para grabar';
  }

  $('#btn-rec').onclick = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = ctx();
      if (ac.state === 'suspended') await ac.resume();
      const src = ac.createMediaStreamSource(mediaStream);
      analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const meter = $('#meter');
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const pct = Math.min(100, (sum / data.length / 128) * 100);
        meter.style.width = pct + '%';
        anim = requestAnimationFrame(tick);
      };
      tick();

      chunks = [];
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = $('#playback');
        a.src = url;
        a.classList.remove('hidden');
        a.play().catch(() => {});
      };
      mediaRecorder.start();
      setRecUI(true);
    } catch (err) {
      console.error(err);
      alert('No se pudo usar el micrófono. Revisá los permisos del navegador.');
    }
  };

  $('#btn-stop-rec').onclick = () => {
    try { mediaRecorder?.stop(); } catch (_) {}
    mediaStream?.getTracks().forEach(t => t.stop());
    if (anim) cancelAnimationFrame(anim);
    $('#meter').style.width = '0%';
    setRecUI(false);
  };
})();
