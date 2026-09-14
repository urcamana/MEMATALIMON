/**
 * MICRO-UNIVERSO - Web MIDI controller + MIDI Learn
 */
let midiAccess = null;
let midiLearnTarget = null;
let midiLearnCallback = null;

function initMIDI(onParamChange) {
    if (!navigator.requestMIDIAccess) {
        const el = document.getElementById('midiStatusVal'); if (el) el.innerText = 'No Compatible';
        return;
    }
    navigator.requestMIDIAccess().then((access) => {
        midiAccess = access;
        const el = document.getElementById('midiStatusVal'); if (el) el.innerText = 'Conectado (USB)';
        attachMIDIInputs(onParamChange);
        midiAccess.onstatechange = (e) => {
            if (e.port.type === 'input') {
                const status = document.getElementById('midiStatusVal');
                if (status) status.innerText = e.port.state === 'connected' ? 'Conectado (USB)' : 'Desconectado';
                if (e.port.state === 'connected') attachMIDIInputs(onParamChange);
            }
        };
    }, () => {
        const el = document.getElementById('midiStatusVal'); if (el) el.innerText = 'No Disponible';
    });
}

function attachMIDIInputs(callback) {
    if (!midiAccess) return;
    for (const input of midiAccess.inputs.values()) {
        input.onmidimessage = (event) => handleMIDIMessage(event, callback);
    }
}

function startMIDILearn(target, callback) {
    midiLearnTarget = target;
    midiLearnCallback = typeof callback === 'function' ? callback : null;
    const status = document.getElementById('midiLearnStatus');
    if (status) status.innerText = 'Esperando movimiento…';
}

function stopMIDILearn() {
    midiLearnTarget = null;
    midiLearnCallback = null;
}

function handleMIDIMessage(event, callback) {
    const [status, data1, data2] = event.data;
    if ((status & 0xF0) !== 0xB0) return;
    const norm = data2 / 127.0;

    if (midiLearnTarget) {
        const learnedCC = data1;
        const target = midiLearnTarget;
        const cb = midiLearnCallback;
        stopMIDILearn();
        const statusEl = document.getElementById('midiLearnStatus');
        if (statusEl) statusEl.innerText = `CC ${learnedCC} → ${target}`;
        if (cb) cb(learnedCC, target);
        return;
    }

    if (typeof callback !== 'function') return;
    // Mapeos de compatibilidad existentes.
    if (data1 === 1) callback('speed', norm * 0.05);
    else if (data1 === 2) callback('attraction', (norm * 0.06) - 0.03);
    else if (data1 === 3) callback('particleSize', (norm * 0.45) + 0.05);
    else if (data1 === 4) callback('timeDilation', norm * 1.5 + 0.05);
    else callback(`cc_${data1}`, norm);
}

window.initMIDI = initMIDI;
window.startMIDILearn = startMIDILearn;
window.stopMIDILearn = stopMIDILearn;
