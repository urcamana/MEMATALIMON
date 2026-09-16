// storage.js - Local formula storage
const KEY = 'micro_universo_fav_formulas';

function saveFormula(name, expr) {
    const list = loadFormulas();
    list[name] = expr;
    localStorage.setItem(KEY, JSON.stringify(list));
}

function loadFormulas() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {
        "Doble Helicoidal": "Math.sin(y)*z, Math.cos(x)*z, Math.sin(x)*y"
    };
}
window.saveFormula = saveFormula;
window.loadFormulas = loadFormulas;
