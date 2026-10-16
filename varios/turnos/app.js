(function () {
  const PREFIX = 'mml_turnos_';
  const $ = (s) => document.querySelector(s);
  const lista = $('#lista');
  const empty = $('#empty');

  function key() {
    return PREFIX + ($('#fecha').value || 'sin-fecha');
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(key()) || '[]');
    } catch (e) {
      return [];
    }
  }

  function save(arr) {
    try {
      localStorage.setItem(key(), JSON.stringify(arr));
    } catch (e) {}
  }

  function isPast(hora, fechaStr) {
    if (!hora || !fechaStr) return false;
    const now = new Date();
    const [hh, mm] = hora.split(':').map(Number);
    const d = new Date(fechaStr + 'T00:00:00');
    d.setHours(hh || 0, mm || 0, 0, 0);
    return now > d;
  }

  function render() {
    const fechaStr = $('#fecha').value;
    const arr = load()
      .slice()
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    lista.innerHTML = '';
    empty.classList.toggle('hidden', arr.length > 0);
    arr.forEach((t) => {
      const past = !t.done && isPast(t.hora, fechaStr);
      const li = document.createElement('li');
      li.className =
        'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ' +
        (t.done ? 'turno-ok border-green-300' : past ? 'turno-pasado border-orange-300' : 'border-primary/15 bg-primary-soft/30');
      li.innerHTML =
        '<button type="button" class="done w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm shrink-0 ' +
        (t.done
          ? 'border-green-600 bg-green-500 text-white'
          : 'border-primary/40 bg-white text-transparent') +
        '" aria-label="Marcar cumplido">' +
        (t.done ? '✓' : '') +
        '</button>' +
        '<span class="hora font-semibold text-sm w-14 shrink-0 ' +
        (t.done ? 'text-green-700' : past ? 'text-orange-700' : 'text-primary-dark') +
        '">' +
        (t.hora || '--:--') +
        '</span>' +
        '<span class="text-sm flex-1 ' +
        (t.done ? 'line-through text-green-800/80' : '') +
        '">' +
        (t.nombre || '') +
        (past && !t.done ? ' <span class="text-[10px] text-orange-600 font-medium">· pasó la hora</span>' : '') +
        (t.done ? ' <span class="text-[10px] text-green-700 font-medium">· cumplido</span>' : '') +
        '</span>' +
        '<button type="button" class="del text-xs text-red-500 shrink-0">Quitar</button>';
      li.querySelector('.done').onclick = () => {
        const a = load();
        const idx = a.findIndex((x) => x.id === t.id);
        if (idx >= 0) {
          a[idx].done = !a[idx].done;
          save(a);
          render();
        }
      };
      li.querySelector('.del').onclick = () => {
        save(load().filter((x) => x.id !== t.id));
        render();
      };
      lista.appendChild(li);
    });
  }

  $('#btn-add').onclick = () => {
    const nombre = $('#nombre').value.trim();
    const hora = $('#hora').value;
    if (!nombre) {
      alert('Escribí un nombre o detalle.');
      return;
    }
    const a = load();
    a.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      hora,
      nombre,
      done: false,
    });
    save(a);
    $('#nombre').value = '';
    render();
  };

  $('#btn-clear-day').onclick = () => {
    if (!confirm('¿Vaciar todos los turnos de este día?')) return;
    save([]);
    render();
  };

  $('#fecha').addEventListener('change', render);

  const today = new Date();
  $('#fecha').value = today.toISOString().slice(0, 10);
  if (!$('#hora').value) {
    const h = String(today.getHours()).padStart(2, '0');
    const m = String(Math.floor(today.getMinutes() / 5) * 5).padStart(2, '0');
    $('#hora').value = h + ':' + m;
  }
  render();
  // refrescar estado "pasó la hora" cada minuto
  setInterval(render, 60000);
})();
