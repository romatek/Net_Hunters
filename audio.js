// =========================================================
// SISTEMA DE AUDIO ESPACIAL Y EFECTOS DE SONIDO (Web Audio API)
// =========================================================

const GestorAudio = (() => {
    let ctxAudio = null;
    let nodoMaster = null;
    let osciladoresActuales = [];
    let intervaloMusica = null;
    let estadoActual = "silencio";

    function inicializar() {
        if (!ctxAudio) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            ctxAudio = new AudioContext();

            nodoMaster = ctxAudio.createGain();
            nodoMaster.gain.value = 0.25; // Volumen general suave
            nodoMaster.connect(ctxAudio.destination);
        }
        if (ctxAudio.state === "suspended") {
            ctxAudio.resume();
        }
    }

    function detenerMusica() {
        if (intervaloMusica) {
            clearInterval(intervaloMusica);
            intervaloMusica = null;
        }
        osciladoresActuales.forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        osciladoresActuales = [];
    }

    // --- MÚSICA ESPACIAL / TRANQUILA (Menú y Partida Normal) ---
    function reproducirEspacial(tipo = "menu") {
        inicializar();
        if (estadoActual === tipo) return;
        detenerMusica();
        estadoActual = tipo;

        const notasBase = tipo === "menu" 
            ? [130.81, 164.81, 196.00, 246.94] 
            : [110.00, 138.59, 164.81, 220.00]; 

        function tocarAcordeEspacial() {
            if (estadoActual !== tipo || !ctxAudio) return;

            const freq = notasBase[Math.floor(Math.random() * notasBase.length)];
            const osc = ctxAudio.createOscillator();
            const ganancia = ctxAudio.createGain();
            const filtro = ctxAudio.createBiquadFilter();

            filtro.type = "lowpass";
            filtro.frequency.value = tipo === "menu" ? 600 : 400;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctxAudio.currentTime);

            ganancia.gain.setValueAtTime(0.001, ctxAudio.currentTime);
            ganancia.gain.linearRampToValueAtTime(0.12, ctxAudio.currentTime + 1.5);
            ganancia.gain.linearRampToValueAtTime(0.001, ctxAudio.currentTime + 5.0);

            osc.connect(filtro);
            filtro.connect(ganancia);
            ganancia.connect(nodoMaster);

            osc.start();
            osc.stop(ctxAudio.currentTime + 5.2);

            osciladoresActuales.push(osc);
            setTimeout(() => {
                const index = osciladoresActuales.indexOf(osc);
                if (index > -1) osciladoresActuales.splice(index, 1);
            }, 5500);
        }

        tocarAcordeEspacial();
        intervaloMusica = setInterval(tocarAcordeEspacial, 3500);
    }

    // --- MÚSICA DE SUSPENSO ---
    function reproducirSuspenso() {
        inicializar();
        if (estadoActual === "suspenso") return;
        detenerMusica();
        estadoActual = "suspenso";

        function latidoTension() {
            if (estadoActual !== "suspenso" || !ctxAudio) return;

            const osc = ctxAudio.createOscillator();
            const ganancia = ctxAudio.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(65.41, ctxAudio.currentTime);
            osc.frequency.exponentialRampToValueAtTime(32.70, ctxAudio.currentTime + 0.3);

            ganancia.gain.setValueAtTime(0.2, ctxAudio.currentTime);
            ganancia.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.35);

            const filtro = ctxAudio.createBiquadFilter();
            filtro.type = "lowpass";
            filtro.frequency.value = 300;

            osc.connect(filtro);
            filtro.connect(ganancia);
            ganancia.connect(nodoMaster);

            osc.start();
            osc.stop(ctxAudio.currentTime + 0.4);

            osciladoresActuales.push(osc);
        }

        latidoTension();
        intervaloMusica = setInterval(latidoTension, 750);
    }

    // =========================================================
    // EFECTOS DE SONIDO (SFX)
    // =========================================================

    // 1. Sonido al tocar cualquier botón
    function sfxBoton() {
        inicializar();
        const osc = ctxAudio.createOscillator();
        const ganancia = ctxAudio.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctxAudio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctxAudio.currentTime + 0.08);

        ganancia.gain.setValueAtTime(0.15, ctxAudio.currentTime);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.09);

        osc.connect(ganancia);
        ganancia.connect(nodoMaster);

        osc.start();
        osc.stop(ctxAudio.currentTime + 0.1);
    }

    // 2. Sonido al atrapar a un impostor (éxito)
    function sfxAtraparImpostor() {
        inicializar();
        const now = ctxAudio.currentTime;
        const osc = ctxAudio.createOscillator();
        const ganancia = ctxAudio.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

        ganancia.gain.setValueAtTime(0.2, now);
        ganancia.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(ganancia);
        ganancia.connect(nodoMaster);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 3. Sonido al atrapar por error a un civil (fallo)
    function sfxAtraparCivil() {
        inicializar();
        const now = ctxAudio.currentTime;
        const osc = ctxAudio.createOscillator();
        const ganancia = ctxAudio.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.25);

        ganancia.gain.setValueAtTime(0.2, now);
        ganancia.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(ganancia);
        ganancia.connect(nodoMaster);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 4. Sonido al recibir daño / ser golpeado
    function sfxDaño() {
        inicializar();
        const now = ctxAudio.currentTime;
        const osc = ctxAudio.createOscillator();
        const ganancia = ctxAudio.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

        ganancia.gain.setValueAtTime(0.25, now);
        ganancia.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(ganancia);
        ganancia.connect(nodoMaster);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 5. Sonido al Ganar la partida
    function sfxGanar() {
        inicializar();
        const now = ctxAudio.currentTime;
        const notas = [523.25, 659.25, 783.99, 1046.50]; // Acorde de C mayor triunfal
        
        notas.forEach((freq, index) => {
            const osc = ctxAudio.createOscillator();
            const ganancia = ctxAudio.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + index * 0.1);

            ganancia.gain.setValueAtTime(0.001, now + index * 0.1);
            ganancia.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.05);
            ganancia.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.6);

            osc.connect(ganancia);
            ganancia.connect(nodoMaster);

            osc.start(now + index * 0.1);
            osc.stop(now + index * 0.1 + 0.65);
        });
    }

    // 6. Sonido al Perder la partida
    function sfxPerder() {
        inicializar();
        const now = ctxAudio.currentTime;
        const notas = [300, 260, 220, 160]; // Notas descendentes tristes
        
        notas.forEach((freq, index) => {
            const osc = ctxAudio.createOscillator();
            const ganancia = ctxAudio.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, now + index * 0.15);

            ganancia.gain.setValueAtTime(0.2, now + index * 0.15);
            ganancia.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.3);

            osc.connect(ganancia);
            ganancia.connect(nodoMaster);

            osc.start(now + index * 0.15);
            osc.stop(now + index * 0.15 + 0.35);
        });
    }

    return {
        menu: () => reproducirEspacial("menu"),
        juego: () => reproducirEspacial("juego"),
        suspenso: () => reproducirSuspenso(),
        detener: () => { detenerMusica(); estadoActual = "silencio"; },
        // SFX expuestos:
        sfxBoton,
        sfxAtraparImpostor,
        sfxAtraparCivil,
        sfxDaño,
        sfxGanar,
        sfxPerder
    };

        // Automatizar sonido en todos los botones del HTML
    document.addEventListener("DOMContentLoaded", () => {
        const botones = document.querySelectorAll("button, .boton");
        botones.forEach(btn => {
            btn.addEventListener("click", () => {
                if (typeof GestorAudio !== "undefined" && GestorAudio.sfxBoton) {
                    GestorAudio.sfxBoton();
                }
            });
        });
    });

})();