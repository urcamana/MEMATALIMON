(function () {
  const $ = (s) => document.querySelector(s);
  const total = $('#total');
  const pago = $('#pago');
  const vueltoEl = $('#vuelto');
  const msg = $('#msg');

  function fmt(n) {
    return '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function calc() {
    const t = parseFloat(total.value) || 0;
    const p = parseFloat(pago.value) || 0;
    if (!t && !p) {
      vueltoEl.textContent = '$0';
      msg.textContent = '';
      return;
    }
    if (p < t) {
      vueltoEl.textContent = fmt(t - p);
      vueltoEl.classList.remove('text-primary-dark');
      vueltoEl.classList.add('text-red-600');
      msg.textContent = 'Falta ' + fmt(t - p);
      return;
    }
    vueltoEl.classList.remove('text-red-600');
    vueltoEl.classList.add('text-primary-dark');
    const v = p - t;
    vueltoEl.textContent = fmt(v);
    msg.textContent = v === 0 ? 'Pago exacto' : 'Devolver ' + fmt(v);
  }

  total.addEventListener('input', calc);
  pago.addEventListener('input', calc);
  document.querySelectorAll('.bill').forEach((btn) => {
    btn.addEventListener('click', () => {
      pago.value = btn.dataset.bill;
      calc();
    });
  });
  $('#btn-clear').onclick = () => {
    total.value = '';
    pago.value = '';
    calc();
    total.focus();
  };
  calc();
})();
