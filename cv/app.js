(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  let template = 'classic';
  let photoDataUrl = '';
  let expItems = [{ role: '', company: '', period: '', desc: '' }];
  let eduItems = [{ degree: '', school: '', period: '' }];

  const fields = {
    name: $('#f-name'),
    title: $('#f-title'),
    email: $('#f-email'),
    phone: $('#f-phone'),
    city: $('#f-city'),
    web: $('#f-web'),
    summary: $('#f-summary'),
    skills: $('#f-skills'),
  };

  const LIMITS = {
    role: 80, company: 80, period: 40, desc: 400,
    degree: 80, school: 80,
  };

  // No partir estos bloques entre páginas del PDF
  const KEEP = 'cv-nobreak';
  const WRAP = 'overflow-wrap:anywhere;word-break:break-word;max-width:100%;';

  $$('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      template = btn.dataset.template;
      $$('.tpl-btn').forEach(b => {
        b.classList.toggle('border-primary', b === btn);
        b.classList.toggle('bg-primary-soft', b === btn);
        b.classList.toggle('border-transparent', b !== btn);
        b.classList.toggle('bg-gray-50', b !== btn);
      });
      render();
    });
  });

  $('#photo-input').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      photoDataUrl = reader.result;
      const img = $('#photo-preview');
      img.src = photoDataUrl;
      img.classList.remove('hidden');
      $('#photo-placeholder').classList.add('hidden');
      render();
    };
    reader.readAsDataURL(file);
  });

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function skillsList() {
    return (fields.skills.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function expCard(item, i) {
    return `
      <div class="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50" data-i="${i}">
        <div class="grid sm:grid-cols-2 gap-2">
          <input data-k="role" maxlength="${LIMITS.role}" value="${esc(item.role)}" placeholder="Puesto" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
          <input data-k="company" maxlength="${LIMITS.company}" value="${esc(item.company)}" placeholder="Empresa" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
          <input data-k="period" maxlength="${LIMITS.period}" value="${esc(item.period)}" placeholder="2020 – Actualidad" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm sm:col-span-2" />
          <textarea data-k="desc" maxlength="${LIMITS.desc}" rows="2" placeholder="Logros y responsabilidades" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm sm:col-span-2 resize-y">${esc(item.desc)}</textarea>
        </div>
        ${expItems.length > 1 ? `<button type="button" class="rm-exp text-xs text-red-500 hover:underline">Quitar</button>` : ''}
      </div>`;
  }

  function eduCard(item, i) {
    return `
      <div class="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50" data-i="${i}">
        <div class="grid sm:grid-cols-2 gap-2">
          <input data-k="degree" maxlength="${LIMITS.degree}" value="${esc(item.degree)}" placeholder="Título / Carrera" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
          <input data-k="school" maxlength="${LIMITS.school}" value="${esc(item.school)}" placeholder="Institución" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
          <input data-k="period" maxlength="${LIMITS.period}" value="${esc(item.period)}" placeholder="2018 – 2022" class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm sm:col-span-2" />
        </div>
        ${eduItems.length > 1 ? `<button type="button" class="rm-edu text-xs text-red-500 hover:underline">Quitar</button>` : ''}
      </div>`;
  }

  function bindList(container, items, cardFn, keyPrefix) {
    container.innerHTML = items.map((it, i) => cardFn(it, i)).join('');
    container.querySelectorAll('[data-k]').forEach(el => {
      el.addEventListener('input', () => {
        const i = +el.closest('[data-i]').dataset.i;
        const k = el.dataset.k;
        const lim = LIMITS[k];
        let v = el.value;
        if (lim && v.length > lim) {
          v = v.slice(0, lim);
          el.value = v;
        }
        items[i][k] = v;
        render();
      });
    });
    container.querySelectorAll('.rm-exp, .rm-edu').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.closest('[data-i]').dataset.i;
        if (keyPrefix === 'exp') {
          expItems.splice(i, 1);
          renderExp();
        } else {
          eduItems.splice(i, 1);
          renderEdu();
        }
        render();
      });
    });
  }

  function renderExp() { bindList($('#exp-list'), expItems, expCard, 'exp'); }
  function renderEdu() { bindList($('#edu-list'), eduItems, eduCard, 'edu'); }

  $('#add-exp').addEventListener('click', () => {
    expItems.push({ role: '', company: '', period: '', desc: '' });
    renderExp();
  });
  $('#add-edu').addEventListener('click', () => {
    eduItems.push({ degree: '', school: '', period: '' });
    renderEdu();
  });

  Object.values(fields).forEach(el => el && el.addEventListener('input', render));

  // Título de sección clásica
  function classicTitle(t) {
    return `<div style="font-family:Inter,system-ui,sans-serif;font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#222;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px;">${t}</div>`;
  }
  function minimalTitle(t) {
    return `<div style="font-size:9pt;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#888;margin-bottom:8px;">${t}</div>`;
  }
  function modernTitle(t) {
    return `<div style="font-size:9pt;text-transform:uppercase;letter-spacing:0.08em;color:#1e3a5f;font-weight:600;margin-bottom:8px;">${t}</div>`;
  }

  // Un ítem de experiencia (bloque indivisible)
  function expBlock(e) {
    return `<div class="${KEEP}" style="margin-bottom:10px;${WRAP}">
      <div style="font-weight:600;color:#1a1a1a;${WRAP}">${esc(e.role)}${e.company ? ' · ' + esc(e.company) : ''}</div>
      ${e.period ? `<div style="font-size:9.5pt;color:#555;margin:2px 0;${WRAP}">${esc(e.period)}</div>` : ''}
      ${e.desc ? `<div style="font-size:10pt;color:#333;${WRAP}">${esc(e.desc)}</div>` : ''}
    </div>`;
  }

  // Un ítem de educación (bloque indivisible)
  function eduBlock(e) {
    return `<div class="${KEEP}" style="margin-bottom:8px;${WRAP}">
      <div style="font-weight:600;color:#1a1a1a;${WRAP}">${esc(e.degree)}</div>
      <div style="font-size:9.5pt;color:#555;${WRAP}">${[e.school, e.period].filter(Boolean).map(esc).join(' · ')}</div>
    </div>`;
  }

  /**
   * Secciones con varios ítems:
   * - El título va junto al PRIMER ítem (si el primero salta de página, el título va con él).
   * - Los ítems siguientes son bloques aparte (pueden ir a la hoja 2 sin repetir el título).
   */
  function multiSection(titleHtml, itemsHtmlArr) {
    if (!itemsHtmlArr.length) return '';
    const first = `<div class="${KEEP}" style="${WRAP}">${titleHtml}${itemsHtmlArr[0]}</div>`;
    const rest = itemsHtmlArr.slice(1).join('');
    return first + rest;
  }

  // Sección de un solo bloque (perfil, habilidades): título + contenido juntos
  function singleSection(titleHtml, bodyHtml) {
    return `<div class="${KEEP}" style="margin-bottom:14px;${WRAP}">${titleHtml}${bodyHtml}</div>`;
  }

  function render() {
    const name = (fields.name.value || '').trim() || 'Tu Nombre';
    const title = (fields.title.value || '').trim();
    const email = (fields.email.value || '').trim();
    const phone = (fields.phone.value || '').trim();
    const city = (fields.city.value || '').trim();
    const web = (fields.web.value || '').trim();
    const summary = (fields.summary.value || '').trim();
    const skills = skillsList();
    const photo = photoDataUrl
      ? `<img class="photo" src="${photoDataUrl}" width="88" height="88" style="width:88px;height:88px;object-fit:cover;border-radius:50%;display:block;" alt="" />`
      : '';
    const contactBits = [email, phone, city, web].filter(Boolean).map(esc);

    const expFiltered = expItems.filter(e => e.role || e.company);
    const eduFiltered = eduItems.filter(e => e.degree || e.school);

    const preview = $('#cv-preview');
    if (!preview) return;

    preview.className = `template-${template} bg-white shadow-lg mx-auto origin-top`;
    preview.style.cssText = [
      'width:100%',
      'max-width:210mm',
      'min-height:297mm',
      'box-sizing:border-box',
      'padding:14mm',
      'font-size:11pt',
      'line-height:1.45',
      'color:#1a1a1a',
      'font-family:Georgia,"Times New Roman",serif',
      'background:#fff',
      'overflow-wrap:anywhere',
      'word-break:break-word',
      'overflow-x:hidden',
    ].join(';');

    if (template === 'classic') {
      const header = `<div class="${KEEP}" style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1.5px solid #222;${WRAP}">
          ${photo ? `<div style="margin-bottom:10px;display:flex;justify-content:center;">${photo}</div>` : ''}
          <div style="font-size:18pt;font-weight:700;letter-spacing:0.02em;color:#111;${WRAP}">${esc(name)}</div>
          ${title ? `<div style="font-size:11pt;color:#444;margin-top:4px;font-family:Inter,system-ui,sans-serif;${WRAP}">${esc(title)}</div>` : ''}
          ${contactBits.length ? `<div style="font-size:9pt;color:#555;margin-top:8px;font-family:Inter,system-ui,sans-serif;${WRAP}">${contactBits.join('  ·  ')}</div>` : ''}
        </div>`;

      const profile = summary
        ? singleSection(classicTitle('Perfil profesional'), `<p style="font-size:10.5pt;color:#333;margin:0;${WRAP}">${esc(summary)}</p>`)
        : '';

      const exp = multiSection(
        classicTitle('Experiencia laboral'),
        expFiltered.map(expBlock)
      );

      const edu = multiSection(
        classicTitle('Educación'),
        eduFiltered.map(eduBlock)
      );

      const sk = skills.length
        ? singleSection(classicTitle('Habilidades'), `<div style="font-size:10pt;color:#333;${WRAP}">${skills.map(esc).join(' · ')}</div>`)
        : '';

      preview.innerHTML = header + profile + exp + edu + sk;
    } else if (template === 'modern') {
      preview.style.fontFamily = 'Inter,system-ui,sans-serif';
      preview.style.padding = '0';
      const photoBig = photo
        ? photo.replace(/88px/g, '96px').replace('width="88"', 'width="96"').replace('height="88"', 'height="96"')
        : '';

      const side = `
        <div style="width:32%;flex-shrink:0;background:#1e3a5f;color:#fff;padding:14mm 8mm;box-sizing:border-box;${WRAP}">
          ${photoBig ? `<div style="margin-bottom:14px;display:flex;justify-content:center;">${photoBig}</div>` : ''}
          ${(email || phone || city || web) ? `
            <div style="font-size:9pt;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Contacto</div>
            <div style="font-size:9pt;line-height:1.7;margin-bottom:18px;${WRAP}">
              ${email ? `<div style="${WRAP}">${esc(email)}</div>` : ''}
              ${phone ? `<div style="${WRAP}">${esc(phone)}</div>` : ''}
              ${city ? `<div style="${WRAP}">${esc(city)}</div>` : ''}
              ${web ? `<div style="${WRAP}">${esc(web)}</div>` : ''}
            </div>` : ''}
          ${skills.length ? `
            <div style="font-size:9pt;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Habilidades</div>
            ${skills.map(s => `<div style="font-size:9.5pt;margin-bottom:4px;${WRAP}">${esc(s)}</div>`).join('')}` : ''}
        </div>`;

      const mainHeader = `<div class="${KEEP}" style="${WRAP}">
          <div style="font-size:17pt;font-weight:700;color:#1e3a5f;line-height:1.15;${WRAP}">${esc(name)}</div>
          ${title ? `<div style="font-size:11pt;color:#555;margin-top:4px;margin-bottom:14px;${WRAP}">${esc(title)}</div>` : '<div style="margin-bottom:14px;"></div>'}
        </div>`;

      const profile = summary
        ? singleSection(modernTitle('Perfil'), `<p style="font-size:10pt;margin:0 0 14px;color:#333;${WRAP}">${esc(summary)}</p>`)
        : '';

      const exp = multiSection(modernTitle('Experiencia'), expFiltered.map(expBlock));
      const edu = multiSection(modernTitle('Educación'), eduFiltered.map(eduBlock));

      preview.innerHTML = `
        <div style="display:flex;min-height:297mm;box-sizing:border-box;width:100%;">
          ${side}
          <div style="width:68%;padding:14mm 11mm;color:#1a1a1a;box-sizing:border-box;${WRAP}">
            ${mainHeader}${profile}${exp}${edu}
          </div>
        </div>`;
    } else {
      const header = `<div class="${KEEP}" style="display:flex;gap:18px;align-items:flex-start;margin-bottom:20px;${WRAP}">
          ${photo}
          <div style="flex:1;min-width:0;${WRAP}">
            <div style="font-size:17pt;font-weight:600;letter-spacing:-0.02em;color:#111;${WRAP}">${esc(name)}</div>
            ${title ? `<div style="font-size:10.5pt;color:#666;margin-top:3px;${WRAP}">${esc(title)}</div>` : ''}
            ${contactBits.length ? `<div style="font-size:9pt;color:#777;margin-top:8px;${WRAP}">${contactBits.join('   ')}</div>` : ''}
          </div>
        </div>`;

      const profile = summary
        ? singleSection(minimalTitle('Perfil'), `<p style="font-size:10.5pt;color:#333;margin:0;${WRAP}">${esc(summary)}</p>`)
        : '';
      const exp = multiSection(minimalTitle('Experiencia'), expFiltered.map(expBlock));
      const edu = multiSection(minimalTitle('Educación'), eduFiltered.map(eduBlock));
      const sk = skills.length
        ? singleSection(minimalTitle('Habilidades'), `<div style="font-size:10pt;color:#444;${WRAP}">${skills.map(esc).join('  ·  ')}</div>`)
        : '';

      preview.style.fontFamily = 'Inter,system-ui,sans-serif';
      preview.innerHTML = header + profile + exp + edu + sk;
    }
  }

  // PDF: A4 real (como el zip que funcionaba) + saltos por bloques .cv-nobreak
  $('#btn-download').addEventListener('click', async () => {
    const source = $('#cv-preview');
    const fileName = ((fields.name.value || 'CV').replace(/[^\w\s-]/g, '').trim()) || 'CV';
    const btn = $('#btn-download');
    const prevLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Generando…';

    const A4_W = 794;                                      // 210 mm @ 96dpi
    const A4_H = Math.round((297 * 96) / 25.4);            // ≈ 1123 px
    const PAD = template === 'modern' ? 0 : 48;            // padding interno en px
    const USABLE_H = A4_H - PAD * 2;                       // alto útil de una página

    const shell = document.createElement('div');
    shell.setAttribute('aria-hidden', 'true');
    shell.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + A4_W + 'px;background:#fff;z-index:-1;pointer-events:none;';
    document.body.appendChild(shell);

    const baseStyle = [
      'width:' + A4_W + 'px',
      'max-width:' + A4_W + 'px',
      'min-width:' + A4_W + 'px',
      'min-height:0',
      'height:auto',
      'margin:0',
      'box-sizing:border-box',
      'box-shadow:none',
      'border:none',
      'border-radius:0',
      'background:#ffffff',
      'font-size:14px',
      'line-height:1.45',
      'color:#1a1a1a',
      'overflow-wrap:anywhere',
      'word-break:break-word',
      'overflow-x:hidden',
      template === 'classic'
        ? 'font-family:Georgia,"Times New Roman",serif'
        : 'font-family:Inter,system-ui,sans-serif',
    ].join(';');

    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));

    try {
      const h2c = window.html2canvas;
      const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
      if (!h2c || !JsPDF) throw new Error('html2canvas o jsPDF no disponibles');

      // --- 1) Clon de medición: mismos estilos, listamos bloques .cv-nobreak en orden ---
      const measure = source.cloneNode(true);
      measure.style.cssText = baseStyle + ';padding:' + PAD + 'px';
      measure.querySelectorAll('[style]').forEach(el => {
        if (el.style.minHeight) el.style.minHeight = '0';
      });
      shell.appendChild(measure);
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 80)));
      await Promise.all([...measure.querySelectorAll('img')].map(img => {
        if (img.complete && img.naturalWidth) return Promise.resolve();
        return new Promise(res => { img.onload = res; img.onerror = res; setTimeout(res, 1500); });
      }));

      // Bloques de primer nivel a no partir (en moderno: los de la columna principal)
      let blockEls;
      if (template === 'modern') {
        const mainCol = measure.querySelector('div > div:last-child');
        blockEls = mainCol
          ? [...mainCol.querySelectorAll(':scope > .cv-nobreak')]
          : [...measure.querySelectorAll('.cv-nobreak')];
      } else {
        blockEls = [...measure.querySelectorAll(':scope > .cv-nobreak')];
      }

      // Si no hay bloques marcados, una sola página con todo
      if (!blockEls.length) {
        blockEls = [measure];
      }

      // Alturas reales
      const heights = blockEls.map(el => el.getBoundingClientRect().height);

      // Empaquetar bloques en páginas sin partir ninguno
      const pages = []; // cada página = array de índices de bloque
      let cur = [];
      let used = 0;
      blockEls.forEach((el, i) => {
        const h = heights[i];
        // Si el bloque solo ya supera la página, igual va solo en su página
        if (cur.length && used + h > USABLE_H) {
          pages.push(cur);
          cur = [];
          used = 0;
        }
        cur.push(i);
        used += h;
      });
      if (cur.length) pages.push(cur);

      // HTML de cada bloque (para rearmar páginas)
      const blockHtml = blockEls.map(el => el.outerHTML);

      // Sidebar del diseño moderno (se repite en cada página)
      let sideHtml = '';
      if (template === 'modern') {
        const side = measure.querySelector('div > div:first-child');
        if (side) sideHtml = side.outerHTML;
      }

      shell.innerHTML = ''; // limpiar medición

      const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const imgWmm = 210;

      for (let p = 0; p < pages.length; p++) {
        const pageDiv = document.createElement('div');
        pageDiv.style.cssText = baseStyle + ';padding:' + PAD + 'px;min-height:' + A4_H + 'px';

        if (template === 'modern' && sideHtml) {
          // Reconstruir layout de dos columnas
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;width:100%;box-sizing:border-box;min-height:' + (A4_H - PAD * 2) + 'px';
          row.innerHTML = sideHtml + '<div style="width:68%;padding:14mm 11mm;box-sizing:border-box;color:#1a1a1a;">' +
            pages[p].map(i => blockHtml[i]).join('') + '</div>';
          // En moderno el padding del pageDiv es 0
          pageDiv.style.padding = '0';
          pageDiv.appendChild(row);
        } else {
          pageDiv.innerHTML = pages[p].map(i => blockHtml[i]).join('');
        }

        shell.appendChild(pageDiv);
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 60)));
        await Promise.all([...pageDiv.querySelectorAll('img')].map(img => {
          if (img.complete && img.naturalWidth) return Promise.resolve();
          return new Promise(res => { img.onload = res; img.onerror = res; setTimeout(res, 1500); });
        }));

        const canvas = await h2c(pageDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          width: A4_W,
          windowWidth: A4_W,
          height: A4_H,
          windowHeight: A4_H,
        });

        // Recortar el canvas a exactamente A4_H * scale si salió más alto
        const scale = 2;
        const targetH = A4_H * scale;
        let outCanvas = canvas;
        if (canvas.height > targetH) {
          outCanvas = document.createElement('canvas');
          outCanvas.width = canvas.width;
          outCanvas.height = targetH;
          const ctx = outCanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
          ctx.drawImage(canvas, 0, 0);
        }

        const imgData = outCanvas.toDataURL('image/jpeg', 0.97);
        if (p > 0) pdf.addPage();
        // Siempre 210 × 297 mm → hoja A4 real
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

        shell.innerHTML = '';
      }

      pdf.save(fileName + '.pdf');
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF. Probá con Chrome o Edge.');
    } finally {
      shell.remove();
      btn.disabled = false;
      btn.innerHTML = prevLabel;
    }
  });

  renderExp();
  renderEdu();
  render();
})();
