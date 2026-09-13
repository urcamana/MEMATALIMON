/**
 * MICRO-UNIVERSO v1.5 - Web MIDI API Hardware Controller
 */
let midiAccess = null;

function initMIDI(onParamChange) {
    if (!navigator.requestMIDIAccess) {
        document.getElementById('midiStatusVal')?.innerText = 'No Compatible';
        return;
    }

    navigator.requestMIDIAccess().then((access) => {
        midiAccess = access;
        document.getElementById('midiStatusVal')?.innerText = 'Conectado (USB)';
        
        const attachInputs = () => {
            for (let input of midiAccess.inputs.values()) {
                input.onmidimessage = (event) => handleMIDIMessage(event, onParamChange);
            }
        };
        attachInputs();

        midiAccess.onstatechange = (e) => {
            if (e.port.type === 'input') {
                document.getElementById('midiStatusVal')?.innerText = 
                    (e.port.state === 'connected') ? 'Conectado (USB)' : 'Desconectado';
                if (e.port.state === 'connected') attachInputs();
            }
        };
    }, () => {
        document.getElementById('midiStatusVal')?.innerText = 'No Disponible';
    });
}

function handleMIDIMessage(event, callback) {
    const [status, data1, data2] = event.data;
    if ((status & 0xF0) === 0xB0 && typeof callback === 'function') { // Control Change
        const norm = data2 / 127.0;
        // Mapeo unificado de perillas estándar CC
        if (data1 === 1) callback('speed', norm * 0.05);
        else if (data1 === 2) callback('attraction', (norm * 0.06) - 0.03);
        else if (data1 === 3) callback('particleSize', (norm * 0.45) + 0.05);
        else callback(`cc_${data1}`, norm); // fallback genérico
    }
}

// Exposición global para script clásico
window.initMIDI = initMIDI;