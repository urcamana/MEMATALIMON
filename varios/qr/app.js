(() => {
  const $ = (s) => document.querySelector(s);
  let tipo = 'url';
  let qr = null;

  const fieldTemplates = {
    url: () => `
      <label class="text-xs text-gray-500">URL o link</label>
      <input id="f-url" type="url" placeholder="https://mematalimon.com.ar" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      <p class="text-[11px] text-gray-400">Incluí https:// para que abra bien en el celular.</p>`,
    wa: () => `
      <label class="text-xs text-gray-500">Número (con código de país, sin + ni 0 adelante del área si ya va el 54)</label>
      <input id="f-phone" type="tel" placeholder="54911xxxxxxxx" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      <label class="text-xs text-gray-500">Mensaje inicial (opcional)</label>
      <input id="f-msg" type="text" placeholder="Hola! Quiero consultar por…" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />`,
    texto: () => `
      <label class="text-xs text-gray-500">Texto libre</label>
      <textarea id="f-text" rows="3" placeholder="Lo que quieras que aparezca al escanear" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"></textarea>`,
    wifi: () => `
      <label class="text-xs text-gray-500">Nombre de la red (SSID)</label>
      <input id="f-ssid" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      <label class="text-xs text-gray-500">Contraseña</label>
      <input id="f-pass" type="text" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      <label class="text-xs text-gray-500">Tipo</label>
      <select id="f-enc" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
        <option value="WPA">WPA/WPA2</option>
        <option value="WEP">WEP</option>
        <option value="nopass">Sin contraseña</option>
      </select>`,
  };

  function renderFields() {
    $('#fields').innerHTML = fieldTemplates[tipo]();
    $('#qr-wrap').classList.add('hidden');
  }

  document.querySelectorAll('.tipo').forEach(btn => {
    btn.onclick = () => {
      tipo = btn.dataset.tipo;
      document.querySelectorAll('.tipo').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.classList.toggle('border-2', on);
        b.classList.toggle('border-primary/30', on);
        b.classList.toggle('border', !on);
        b.classList.toggle('border-primary/15', !on);
        const t = b.querySelector('.font-bold');
        if (t) t.classList.toggle('text-primary-dark', on);
      });
      renderFields();
    };
  });

  $('#size').oninput = e => { $('#size-val').textContent = e.target.value; };
  document.querySelectorAll('.size-preset').forEach(b => {
    b.onclick = () => {
      $('#size').value = b.dataset.s;
      $('#size-val').textContent = b.dataset.s;
    };
  });

  function buildPayload() {
    if (tipo === 'url') {
      let u = ($('#f-url')?.value || '').trim();
      if (!u) throw new Error('Escribí un link.');
      if (!/^https?:\/\//i.test(u) && !u.includes('://')) u = 'https://' + u;
      return u;
    }
    if (tipo === 'wa') {
      let phone = ($('#f-phone')?.value || '').replace(/\D/g, '');
      if (!phone) throw new Error('Escribí el número de WhatsApp.');
      const msg = ($('#f-msg')?.value || '').trim();
      let url = 'https://wa.me/' + phone;
      if (msg) url += '?text=' + encodeURIComponent(msg);
      return url;
    }
    if (tipo === 'texto') {
      const t = ($('#f-text')?.value || '').trim();
      if (!t) throw new Error('Escribí un texto.');
      return t;
    }
    if (tipo === 'wifi') {
      const ssid = ($('#f-ssid')?.value || '').trim();
      if (!ssid) throw new Error('Escribí el nombre de la red.');
      const pass = ($('#f-pass')?.value || '');
      const enc = $('#f-enc')?.value || 'WPA';
      const esc = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');
      if (enc === 'nopass') return `WIFI:T:nopass;S:${esc(ssid)};;`;
      return `WIFI:T:${enc};S:${esc(ssid)};P:${esc(pass)};;`;
    }
    return '';
  }

  $('#btn-gen').onclick = () => {
    $('#err').classList.add('hidden');
    try {
      const text = buildPayload();
      const size = +$('#size').value || 240;
      const box = $('#qrcode');
      box.innerHTML = '';
      qr = new QRCode(box, {
        text,
        width: size,
        height: size,
        colorDark: '#2d2a33',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
      $('#qr-wrap').classList.remove('hidden');
    } catch (e) {
      $('#err').textContent = e.message || String(e);
      $('#err').classList.remove('hidden');
    }
  };

  $('#btn-dl').onclick = () => {
    const canvas = $('#qrcode canvas');
    const img = $('#qrcode img');
    let href = '';
    if (canvas) href = canvas.toDataURL('image/png');
    else if (img) href = img.src;
    if (!href) return;
    const size = $('#size')?.value || 'qr';
    const a = document.createElement('a');
    a.href = href;
    a.download = `qr-${size}px.png`;
    a.click();
  };

  renderFields();
})();
