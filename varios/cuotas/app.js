(function () {
  const $ = (s) => document.querySelector(s);
  function fmt(n) {
    return '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function calc() {
    const p = parseFloat($('#precio').value) || 0;
    const r = parseFloat($('#recargo').value) || 0;
    const n = Math.max(1, parseInt($('#ncuotas').value, 10) || 1);
    const final = p * (1 + r / 100);
    const cuota = final / n;
    const extra = final - p;
    $('#final').textContent = fmt(final);
    $('#cuota').textContent = fmt(cuota);
    $('#recargoPesos').textContent = fmt(extra);
    if (!p) { $('#resumen').textContent = ''; return; }
    $('#resumen').textContent = n === 1
      ? (r ? 'Un pago de ' + fmt(final) + ' (incluye ' + r + '% de recargo).' : 'Un pago de ' + fmt(final) + ' sin recargo.')
      : n + ' cuotas de ' + fmt(cuota) + ' · total ' + fmt(final) + (r ? ' (+' + r + '%)' : '');
  }
  ['precio', 'recargo', 'ncuotas'].forEach((id) => $( '#' + id).addEventListener('input', calc));
  document.querySelectorAll('.rbtn').forEach((b) => b.addEventListener('click', () => { $('#recargo').value = b.dataset.r; calc(); }));
  document.querySelectorAll('.cbtn').forEach((b) => b.addEventListener('click', () => { $('#ncuotas').value = b.dataset.c; calc(); }));
  calc();
})();
