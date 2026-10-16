(() => {
  const $ = (s) => document.querySelector(s);
  const playlist = []; // { id, file, url, name, type: 'audio'|'video' }
  let index = -1;
  let wakeLock = null;
  let seeking = false;

  const audio = $('#audio');
  const video = $('#video');
  const videoWrap = $('#video-wrap');

  function fmt(t) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function currentEl() {
    if (index < 0 || !playlist[index]) return null;
    return playlist[index].type === 'video' ? video : audio;
  }

  function renderList() {
    $('#count').textContent = playlist.length ? playlist.length + ' archivo(s)' : '';
    $('#empty').classList.toggle('hidden', playlist.length > 0);
    $('#list').innerHTML = playlist.map((item, i) => `
      <li class="track flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-4 border-transparent ${i === index ? 'active' : ''}" data-i="${i}">
        <span class="text-xs text-gray-400 w-5">${i + 1}</span>
        <span class="text-lg">${item.type === 'video' ? '🎬' : '🎵'}</span>
        <span class="flex-1 min-w-0 text-sm truncate">${item.name}</span>
        <button type="button" data-rm="${i}" class="text-red-400 text-xs font-semibold px-1">✕</button>
      </li>`).join('');
    $('#list').querySelectorAll('.track').forEach(li => {
      li.onclick = (e) => {
        if (e.target.dataset.rm != null) return;
        playIndex(+li.dataset.i);
      };
    });
    $('#list').querySelectorAll('[data-rm]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        removeAt(+btn.dataset.rm);
      };
    });
  }

  function removeAt(i) {
    const was = index;
    URL.revokeObjectURL(playlist[i].url);
    playlist.splice(i, 1);
    if (!playlist.length) {
      index = -1;
      stopAll();
      $('#now').textContent = 'Nada en reproducción';
    } else if (i < was) index--;
    else if (i === was) playIndex(Math.min(was, playlist.length - 1));
    renderList();
  }

  function stopAll() {
    audio.pause();
    video.pause();
    audio.removeAttribute('src');
    video.removeAttribute('src');
    videoWrap.classList.add('hidden');
  }

  async function requestWake() {
    $('#wake-msg').textContent = '';
    if (!$('#wake').checked) {
      releaseWake();
      return;
    }
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          $('#wake-msg').textContent = 'Bloqueo de pantalla liberado';
        });
        $('#wake-msg').textContent = 'Pantalla activa mientras suena (si el sistema lo permite)';
      } else {
        $('#wake-msg').textContent = 'Este navegador no permite mantener la pantalla activa';
      }
    } catch (err) {
      $('#wake-msg').textContent = 'No se pudo activar pantalla activa';
    }
  }

  function releaseWake() {
    try { wakeLock?.release(); } catch (_) {}
    wakeLock = null;
  }

  function playIndex(i) {
    if (i < 0 || i >= playlist.length) return;
    stopAll();
    index = i;
    const item = playlist[i];
    $('#now').textContent = item.name;
    renderList();

    if (item.type === 'video') {
      videoWrap.classList.remove('hidden');
      video.src = item.url;
      video.volume = +$('#vol').value;
      video.play().then(requestWake).catch(() => {});
    } else {
      videoWrap.classList.add('hidden');
      audio.src = item.url;
      audio.volume = +$('#vol').value;
      audio.play().then(requestWake).catch(() => {});
    }
    updatePlayBtn();
  }

  function updatePlayBtn() {
    const el = currentEl();
    const playing = el && !el.paused;
    $('#btn-play').textContent = playing ? '⏸' : '▶';
  }

  function addFiles(fileList, forceType) {
    const arr = [...fileList];
    if (arr.length > 20) {
      alert('Elegí de a 20 como máximo por vez. Podés seguir agregando después.');
    }
    const slice = arr.slice(0, 20);
    for (const file of slice) {
      const isVid = forceType === 'video' || file.type.startsWith('video/') || /\.(mp4|webm|ogv|mov|mkv)$/i.test(file.name);
      const isAud = forceType === 'audio' || file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|opus|oga)$/i.test(file.name);
      if (!isVid && !isAud) continue;
      const type = isVid ? 'video' : 'audio';
      playlist.push({
        id: Date.now() + Math.random(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type,
      });
    }
    renderList();
    if (index < 0 && playlist.length) playIndex(0);
  }

  $('#add-audio').onchange = () => { addFiles($('#add-audio').files, 'audio'); $('#add-audio').value = ''; };
  $('#add-video').onchange = () => { addFiles($('#add-video').files, 'video'); $('#add-video').value = ''; };

  $('#btn-clear').onclick = () => {
    stopAll();
    releaseWake();
    playlist.forEach(p => URL.revokeObjectURL(p.url));
    playlist.length = 0;
    index = -1;
    $('#now').textContent = 'Nada en reproducción';
    renderList();
  };

  $('#btn-play').onclick = () => {
    if (index < 0 && playlist.length) { playIndex(0); return; }
    const el = currentEl();
    if (!el) return;
    if (el.paused) el.play().then(requestWake).catch(() => {});
    else { el.pause(); releaseWake(); }
    updatePlayBtn();
  };

  $('#btn-prev').onclick = () => {
    if (!playlist.length) return;
    playIndex(index <= 0 ? playlist.length - 1 : index - 1);
  };
  $('#btn-next').onclick = () => {
    if (!playlist.length) return;
    playIndex(index >= playlist.length - 1 ? 0 : index + 1);
  };

  $('#vol').oninput = () => {
    const v = +$('#vol').value;
    audio.volume = v;
    video.volume = v;
  };

  $('#wake').onchange = () => {
    const el = currentEl();
    if ($('#wake').checked && el && !el.paused) requestWake();
    else releaseWake();
  };

  function bindMedia(el) {
    el.addEventListener('timeupdate', () => {
      if (seeking || el !== currentEl()) return;
      const d = el.duration || 0;
      $('#seek').value = d ? Math.floor((el.currentTime / d) * 1000) : 0;
      $('#t-cur').textContent = fmt(el.currentTime);
      $('#t-dur').textContent = fmt(d);
      updatePlayBtn();
    });
    el.addEventListener('ended', () => {
      if (index < playlist.length - 1) playIndex(index + 1);
      else releaseWake();
      updatePlayBtn();
    });
    el.addEventListener('play', updatePlayBtn);
    el.addEventListener('pause', updatePlayBtn);
  }
  bindMedia(audio);
  bindMedia(video);

  $('#seek').addEventListener('input', () => { seeking = true; });
  $('#seek').addEventListener('change', () => {
    const el = currentEl();
    if (el && el.duration) el.currentTime = (+$('#seek').value / 1000) * el.duration;
    seeking = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const el = currentEl();
      if (el && !el.paused) requestWake();
    }
  });

  renderList();
})();
