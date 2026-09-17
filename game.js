document.addEventListener("DOMContentLoaded", () => {

    console.log("🔥 GAME.JS NET HUNTERS - IMPOSTORES ACTIVADOS");

    // =========================================================
    // CANVAS
    // =========================================================

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    let ancho = window.innerWidth;
    let alto = window.innerHeight;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function ajustarCanvas() {
        ancho = window.innerWidth;
        alto = window.innerHeight;

        canvas.width = ancho * dpr;
        canvas.height = alto * dpr;

        canvas.style.width = ancho + "px";
        canvas.style.height = alto + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ajustarCanvas();

    // =========================================================
    // ESTADO DEL JUEGO
    // =========================================================

    let juegoActivo = false;
    let juegoPausado = false;

    let puntos = 0;
    let capturados = 0;

    let tiempoPartida = 120;
    let tiempoInicio = 0;

    // =========================================================
    // IMPOSTORES
    // =========================================================

    const CANTIDAD_IMPOSTORES = 5;
    let impostoresRestantes = CANTIDAD_IMPOSTORES;

    // =========================================================
    // VIDA DEL JUGADOR
    // =========================================================

    let vidaJugador = 3;
    const vidaMaxima = 3;

    let invulnerableHasta = 0;

    // =========================================================
    // ALERTA / PELIGRO
    // =========================================================

    let nivelPeligro = 0;

    // =========================================================
    // CONTROLES
    // =========================================================

    const TECLA = {
        arriba: false,
        abajo: false,
        izquierda: false,
        derecha: false,
        run: false
    };

    // =========================================================
    // MUNDO
    // =========================================================

    const mundo = {
        ancho: 2400,
        alto: 1800
    };
    
    // =========================================================
    // CRONÓMETRO (CUENTA REGRESIVA)
    // =========================================================

    // --- VARIABLES GLOBALES DEL CRONÓMETRO ---
    let segundosRestantes = 180; // ⏱️ 180 segundos = 3 minutos (modificalo acá si querés otro tiempo inicial)
    let intervaloCronometro = null;

    // --- FUNCIONES DEL CRONÓMETRO ---
    function iniciarCronometro() {
        segundosRestantes = 180; // Reinicia el tiempo al arrancar la partida
        const elementoCronometro = document.getElementById("textoCronometro");
        
        if (intervaloCronometro) clearInterval(intervaloCronometro);

        intervaloCronometro = setInterval(() => {
            if (segundosRestantes > 0) {
                segundosRestantes--; // Resta un segundo cada vez
            } else {
                // 🛑 EL TIEMPO LLEGó A CERO
                detenerCronometro();
                
                // Si tenés una función de fin de juego por tiempo, se ejecuta acá:
                if (typeof finalizarJuegoPorTiempo === "function") {
                    finalizarJuegoPorTiempo();
                }
                return;
            }

            let minutos = Math.floor(segundosRestantes / 60);
            let segundos = segundosRestantes % 60;

            let minFormateado = String(minutos).padStart(2, '0');
            let segFormateado = String(segundos).padStart(2, '0');

            if (elementoCronometro) {
                elementoCronometro.textContent = `${minFormateado}:${segFormateado}`;
            }
        }, 1000);
    }

    function detenerCronometro() {
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }
    }

    // =========================================================
    // JUGADOR
    // =========================================================

    const jugador = {
        x: mundo.ancho / 2,
        y: mundo.alto / 2,

        radio: 20,

        velocidad: 4,
        velocidadRun: 7,

        angulo: 0,

        color: "#16a9ff", // Azul principal del jugador

        usandoRun: false,

        energiaRun: 100,
        energiaRunMax: 100,

        sospecha: 0,
        ultimaRed: 0,

        cambiandoColor: false,
        finCambioColor: 0
    };

    // =========================================================
    // CÁMARA
    // =========================================================

    const camara = {
        x: 0,
        y: 0
    };

    // =========================================================
    // MOUSE
    // =========================================================

    const mouse = {
        x: ancho / 2,
        y: alto / 2,
        mundoX: 0,
        mundoY: 0,
        presionado: false
    };

    // =========================================================
    // SOSPECHOSOS
    // =========================================================

    const sospechosos = [];
    const CANTIDAD_SOSPECHOSOS = 25;

    // Colores variados y distintos para cada personaje
    const coloresSospechosos = [
        "#ff3344", // Rojo
        "#33ccff", // Celeste
        "#33ff66", // Verde
        "#ff6600", // Amarillo
        "#ff66cc", // Rosa
        "#9933ff", // Morado
        "#ff9933", // Naranja
        "#00e6ac", // Turquesa
        "#cc99ff", // Lila
        "#e6e600"  // Lima
    ];

    // =========================================================
    // REDES
    // =========================================================

    const redes = [];
    const ALCANCE_RED = 190;

    // =========================================================
    // PARTÍCULAS
    // =========================================================

    const particulas = [];

    // =========================================================
    // ANIMACIÓN
    // =========================================================

    let tiempoAnimacion = 0;

    // =========================================================
    // GENERAR SOSPECHOSOS
    // =========================================================

    function generarSospechosos() {
        sospechosos.length = 0;
        const indicesImpostores = [];

        while (indicesImpostores.length < CANTIDAD_IMPOSTORES) {
            const indice = Math.floor(Math.random() * CANTIDAD_SOSPECHOSOS);
            if (!indicesImpostores.includes(indice)) {
                indicesImpostores.push(indice);
            }
        }

        for (let i = 0; i < CANTIDAD_SOSPECHOSOS; i++) {
            let x;
            let y;

            do {
                x = 150 + Math.random() * (mundo.ancho - 300);
                y = 150 + Math.random() * (mundo.alto - 300);
            } while (distancia(x, y, jugador.x, jugador.y) < 300);

            const velocidadBase = 1.1 + Math.random() * 0.7;
            const esImpostor = indicesImpostores.includes(i);

            sospechosos.push({
                x,
                y,
                radio: 17,
                velocidad: velocidadBase,
                velocidadRun: 3.8 + Math.random() * 0.3,
                energiaRun: 100,
                energiaRunMax: 100,
                usandoRun: false,
                angulo: Math.random() * Math.PI * 2,
                direccionCambio: 0,
                tipo: i,
                color: coloresSospechosos[i % coloresSospechosos.length],
                capturado: false,
                animacionCaptura: 0,

                esImpostor,
                estadoImpostor: "oculto",
                sospecha: 0,
                objetivoJugador: false,
                tiempoAtaque: 0,
                cooldownAtaque: 0,
                ultimaDecisionRun: 0,
                direccionAnterior: 0,
                movimientoRuido: Math.random() * 100,
                tiempoPersiguiendo: 0
            });
        }

        impostoresRestantes = CANTIDAD_IMPOSTORES;
        console.log("🕵️ Impostores generados:", CANTIDAD_IMPOSTORES);
    }

    // =========================================================
    // GENERAR RED
    // =========================================================

    function lanzarRed() {
        if (!juegoActivo || juegoPausado) return;

        const ahora = Date.now();
        if (ahora - jugador.ultimaRed < 250) return;

        let objetivo = null;
        let distanciaMinima = Infinity;

        for (const sospechoso of sospechosos) {
            if (sospechoso.capturado) continue;

            const d = distancia(jugador.x, jugador.y, sospechoso.x, sospechoso.y);
            if (d < distanciaMinima) {
                distanciaMinima = d;
                objetivo = sospechoso;
            }
        }

        if (!objetivo || distanciaMinima > ALCANCE_RED) {
            mostrarNotificacion("🕸️ Acercate más para usar la red");
            return;
        }

        jugador.ultimaRed = ahora;
        jugador.cambiandoColor = true;
        jugador.finCambioColor = ahora + 120;

        jugador.sospecha += 22;
        jugador.sospecha = limitar(jugador.sospecha, 0, 100);

        const dx = objetivo.x - jugador.x;
        const dy = objetivo.y - jugador.y;
        const angulo = Math.atan2(dy, dx);

        redes.push({
            x: jugador.x,
            y: jugador.y,
            vx: Math.cos(angulo) * 13,
            vy: Math.sin(angulo) * 13,
            radio: 12,
            vida: 70,
            rotacion: 0,
            escala: 0.8,
            objetivo
        });
    }

    // =========================================================
    // MOVIMIENTO DEL JUGADOR
    // =========================================================

    function actualizarJugador(delta) {
        let dx = 0;
        let dy = 0;

        if (TECLA.arriba) dy -= 1;
        if (TECLA.abajo) dy += 1;
        if (TECLA.izquierda) dx -= 1;
        if (TECLA.derecha) dx += 1;

        const moviendo = dx !== 0 || dy !== 0;

        if (moviendo) {
            const longitud = Math.sqrt(dx * dx + dy * dy);
            dx /= longitud;
            dy /= longitud;

            jugador.usandoRun = TECLA.run && jugador.energiaRun > 0;
            let velocidadActual = jugador.velocidad;

            if (jugador.usandoRun) {
                velocidadActual = jugador.velocidadRun;
                jugador.energiaRun -= 0.75 * delta;
                jugador.sospecha += 0.015 * delta;
            } else {
                jugador.energiaRun += 0.45 * delta;
            }

            jugador.energiaRun = limitar(jugador.energiaRun, 0, jugador.energiaRunMax);

            jugador.x += dx * velocidadActual * delta;
            jugador.y += dy * velocidadActual * delta;
            jugador.angulo = Math.atan2(dy, dx);

        } else {
            jugador.usandoRun = false;
            jugador.energiaRun += 0.7 * delta;
            jugador.energiaRun = limitar(jugador.energiaRun, 0, jugador.energiaRunMax);
            jugador.sospecha -= 0.025 * delta;
        }

        jugador.x = limitar(jugador.x, jugador.radio, mundo.ancho - jugador.radio);
        jugador.y = limitar(jugador.y, jugador.radio, mundo.alto - jugador.radio);

        if (Date.now() - jugador.ultimaRed > 1800) {
            jugador.sospecha -= 0.08 * delta;
        }
        jugador.sospecha = limitar(jugador.sospecha, 0, 100);

        if (jugador.cambiandoColor && Date.now() > jugador.finCambioColor) {
            jugador.cambiandoColor = false;
        }
    }

    // =========================================================
    // ACTUALIZAR SOSPECHOSOS
    // =========================================================

    function actualizarSospechosos(delta) {
        const ahora = Date.now();

        for (const sospechoso of sospechosos) {
            if (sospechoso.capturado) continue;

            if (!sospechoso.usandoRun) {
                sospechoso.energiaRun += 0.5 * delta;
            } else {
                sospechoso.energiaRun -= 0.75 * delta;
            }
            sospechoso.energiaRun = limitar(sospechoso.energiaRun, 0, sospechoso.energiaRunMax);

            if (ahora - sospechoso.ultimaDecisionRun > 1000 + Math.random() * 2000) {
                sospechoso.ultimaDecisionRun = ahora;
                if (sospechoso.energiaRun > 30 && Math.random() < 0.22) {
                    sospechoso.usandoRun = true;
                } else {
                    sospechoso.usandoRun = false;
                }
            }

            if (!sospechoso.esImpostor) {
                actualizarCivil(sospechoso, delta);
                continue;
            }

            actualizarImpostor(sospechoso, delta);
        }
    }

    function actualizarCivil(sospechoso, delta) {
        sospechoso.direccionCambio -= delta;
        if (sospechoso.direccionCambio <= 0) {
            sospechoso.angulo += (Math.random() - 0.5) * 1.5;
            sospechoso.direccionCambio = 30 + Math.random() * 100;
        }

        const velocidad = sospechoso.usandoRun ? sospechoso.velocidadRun : sospechoso.velocidad;
        sospechoso.x += Math.cos(sospechoso.angulo) * velocidad * delta;
        sospechoso.y += Math.sin(sospechoso.angulo) * velocidad * delta;

        rebotarSospechoso(sospechoso);
    }

    function actualizarImpostor(sospechoso, delta) {
        const d = distancia(sospechoso.x, sospechoso.y, jugador.x, jugador.y);

        if (d > 550) {
            sospechoso.estadoImpostor = "oculto";
            sospechoso.objetivoJugador = false;
            sospechoso.sospecha = Math.max(0, sospechoso.sospecha - 0.1 * delta);
            actualizarCivil(sospechoso, delta);
            return;
        }

        if (d < 500) {
            if (Date.now() - jugador.ultimaRed < 800) {
                sospechoso.sospecha += 1.8 * delta;
            }
            if (jugador.usandoRun && d < 350) {
                sospechoso.sospecha += 0.35 * delta;
            }
            if (d < 220) {
                sospechoso.sospecha += 0.15 * delta;
            }
            if (!jugador.usandoRun && Date.now() - jugador.ultimaRed > 1500) {
                sospechoso.sospecha -= 0.2 * delta;
            }
        }

        sospechoso.sospecha = limitar(sospechoso.sospecha, 0, 100);

        if (sospechoso.sospecha >= 70 && d < 450) {
            sospechoso.objetivoJugador = true;
            sospechoso.estadoImpostor = "acechando";
        }

        if (sospechoso.objetivoJugador && d < 420) {
            sospechoso.tiempoPersiguiendo += delta;
            const direccionJugador = Math.atan2(jugador.y - sospechoso.y, jugador.x - sospechoso.x);
            const ruido = Math.sin((tiempoAnimacion + sospechoso.movimientoRuido) * 0.03) * 0.35;
            sospechoso.angulo = direccionJugador + ruido;
            sospechoso.estadoImpostor = "acechando";
        } else {
            sospechoso.objetivoJugador = false;
            sospechoso.estadoImpostor = "oculto";
            sospechoso.direccionCambio -= delta;
            if (sospechoso.direccionCambio <= 0) {
                sospechoso.angulo += (Math.random() - 0.5) * 1.5;
                sospechoso.direccionCambio = 30 + Math.random() * 100;
            }
        }

        if (sospechoso.objetivoJugador && d < 42 && Date.now() > sospechoso.cooldownAtaque) {
            atacarJugador(sospechoso);
        }

        const velocidad = sospechoso.usandoRun ? sospechoso.velocidadRun : sospechoso.velocidad;
        sospechoso.x += Math.cos(sospechoso.angulo) * velocidad * delta;
        sospechoso.y += Math.sin(sospechoso.angulo) * velocidad * delta;

        rebotarSospechoso(sospechoso);
    }

    function atacarJugador(impostor) {
        const ahora = Date.now();
        if (ahora < invulnerableHasta) return;

        vidaJugador--;
        invulnerableHasta = ahora + 1300;
        impostor.cooldownAtaque = ahora + 1700;
        impostor.estadoImpostor = "atacando";

        // 🎵 AGREGAR ESTO:
        GestorAudio.sfxDaño();

        const angulo = Math.atan2(jugador.y - impostor.y, jugador.x - impostor.x);
        jugador.x += Math.cos(angulo) * 80;
        jugador.y += Math.sin(angulo) * 80;

        crearParticulas(jugador.x, jugador.y, "#ff3344", 18);
        mostrarNotificacion("⚠️ ¡Alguien intentó atraparte!");

        if (vidaJugador <= 0) {
            terminarJuego("¡Te capturaron!");
        }
    }

    function rebotarSospechoso(sospechoso) {
        if (sospechoso.x < sospechoso.radio) {
            sospechoso.x = sospechoso.radio;
            sospechoso.angulo = Math.PI - sospechoso.angulo;
        }
        if (sospechoso.x > mundo.ancho - sospechoso.radio) {
            sospechoso.x = mundo.ancho - sospechoso.radio;
            sospechoso.angulo = Math.PI - sospechoso.angulo;
        }
        if (sospechoso.y < sospechoso.radio) {
            sospechoso.y = sospechoso.radio;
            sospechoso.angulo = -sospechoso.angulo;
        }
        if (sospechoso.y > mundo.alto - sospechoso.radio) {
            sospechoso.y = mundo.alto - sospechoso.radio;
            sospechoso.angulo = -sospechoso.angulo;
        }
    }

    // =========================================================
    // ACTUALIZAR REDES
    // =========================================================

    function actualizarRedes(delta) {
        for (let i = redes.length - 1; i >= 0; i--) {
            const red = redes[i];
            red.x += red.vx * delta;
            red.y += red.vy * delta;
            red.vida -= delta;
            red.rotacion += 0.25 * delta;
            red.escala += 0.01 * delta;

            for (const sospechoso of sospechosos) {
                if (sospechoso.capturado) continue;

                const d = distancia(red.x, red.y, sospechoso.x, sospechoso.y);
                if (d < red.radio + sospechoso.radio) {
                    capturarSospechoso(sospechoso);
                    red.vida = 0;
                    break;
                }
            }

            if (red.vida <= 0) {
                redes.splice(i, 1);
            }
        }
    }

    // =========================================================
    // CAPTURAR SOSPECHOSO (Con animación de red y desaparición)
    // =========================================================

    function capturarSospechoso(sospechoso) {
        if (sospechoso.capturado) return;

        sospechoso.capturado = true;
        sospechoso.animacionCaptura = 1;

        crearParticulas(sospechoso.x, sospechoso.y, "#ffffff", 20);
        capturados++;

        if (!sospechoso.esImpostor) {
            const perdida = 100;
            puntos -= perdida;
            puntos = Math.max(-1000, puntos);

            // 🎵 AGREGAR ESTO:
            GestorAudio.sfxAtraparCivil();

            mostrarCaptura("❌ ¡ERA UN CIVIL!", `-${perdida} puntos`);
            mostrarNotificacion("❌ Capturaste a un civil");
        } else {
            impostoresRestantes--;
            const recompensa = 500;
            puntos += recompensa;

            // 🎵 AGREGAR ESTO:
            GestorAudio.sfxAtraparImpostor();

            mostrarCaptura("🎯 ¡IMPOSTOR CAPTURADO!", `+${recompensa} puntos`);
            mostrarNotificacion("🎯 ¡Encontraste a un impostor!");

            if (impostoresRestantes <= 0) {
                // 🎵 AGREGAR ESTO:
                GestorAudio.sfxGanar();

                setTimeout(() => {
                    terminarJuego("¡CAPTURASTE A TODOS LOS IMPOSTORES!");
                }, 900);
            }
        }

        actualizarHUD();

        // Desaparece después de mostrar la animación de la red encerrándolo (1 segundo)
        setTimeout(() => {
            const indice = sospechosos.indexOf(sospechoso);
            if (indice !== -1) {
                sospechosos.splice(indice, 1);
            }
        }, 1000);
    }

    function mostrarCaptura(titulo, puntosTexto) {
        const mensaje = document.getElementById("mensajeCaptura");
        const puntosElemento = document.getElementById("capturaPuntos");

        if (mensaje) mensaje.textContent = titulo;
        if (puntosElemento) puntosElemento.textContent = puntosTexto;

        const contenedor = document.getElementById("mensajeCaptura");
        if (contenedor) {
            contenedor.classList.remove("mostrar");
            void contenedor.offsetWidth;
            contenedor.classList.add("mostrar");

            setTimeout(() => {
                contenedor.classList.remove("mostrar");
            }, 900);
        }
    }

    // =========================================================
    // PARTÍCULAS
    // =========================================================

    function crearParticulas(x, y, color, cantidad) {
        for (let i = 0; i < cantidad; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const velocidad = 1 + Math.random() * 4;

            particulas.push({
                x,
                y,
                vx: Math.cos(angulo) * velocidad,
                vy: Math.sin(angulo) * velocidad,
                vida: 30 + Math.random() * 30,
                color,
                radio: 2 + Math.random() * 3
            });
        }
    }

    function actualizarParticulas(delta) {
        for (let i = particulas.length - 1; i >= 0; i--) {
            const p = particulas[i];
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.vida -= delta;

            if (p.vida <= 0) {
                particulas.splice(i, 1);
            }
        }
    }

    // =========================================================
    // HUD
    // =========================================================

    function actualizarHUD() {
        const puntosElemento = document.getElementById("puntos");
        const capturadosElemento = document.getElementById("capturados");

        if (puntosElemento) puntosElemento.textContent = puntos;
        if (capturadosElemento) capturadosElemento.textContent = capturados;

        const objetivoTexto = document.getElementById("objetivoTexto");
        if (objetivoTexto) {
            const corazones = "❤️".repeat(vidaJugador) + "🖤".repeat(vidaMaxima - vidaJugador);
            objetivoTexto.textContent = `IMPOSTORES: ${impostoresRestantes} • ${corazones}`;
        }
    }

    // =========================================================
    // CÁMARA
    // =========================================================

    function actualizarCamara() {
        camara.x = jugador.x - ancho / 2;
        camara.y = jugador.y - alto / 2;

        camara.x = limitar(camara.x, 0, mundo.ancho - ancho);
        camara.y = limitar(camara.y, 0, mundo.alto - alto);
    }

    // =========================================================
    // DIBUJAR MAPA
    // =========================================================

    function dibujarMapa() {
        ctx.fillStyle = "#07111d";
        ctx.fillRect(0, 0, ancho, alto);

        ctx.save();
        ctx.translate(-camara.x, -camara.y);

        ctx.fillStyle = "#0c1a29";
        ctx.fillRect(0, 0, mundo.ancho, mundo.alto);

        ctx.strokeStyle = "rgba(100,170,220,0.08)";
        ctx.lineWidth = 1;

        const tamañoGrid = 80;
        for (let x = 0; x <= mundo.ancho; x += tamañoGrid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mundo.alto);
            ctx.stroke();
        }

        for (let y = 0; y <= mundo.alto; y += tamañoGrid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mundo.ancho, y);
            ctx.stroke();
        }

        ctx.strokeStyle = "#1c5c83";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, mundo.ancho, mundo.alto);

        ctx.restore();
    }

    // =========================================================
    // DIBUJAR SOSPECHOSOS (Estilo Cuadrado Among Us / Visor Oscuro / Ojos Rojos)
    // =========================================================

    function dibujarSospechosos() {
        ctx.save();
        ctx.translate(-camara.x, -camara.y);

        for (let sospechoso of sospechosos) {
            ctx.save();
            ctx.translate(sospechoso.x, sospechoso.y);

            // Sombra
            ctx.beginPath();
            ctx.ellipse(0, 18, 16, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fill();

            // Cuerpo cuadrado estilo Among Us (FIJO, cabeza arriba)
            ctx.beginPath();
            ctx.roundRect(-14, -12, 28, 30, [10, 10, 6, 6]);
            ctx.fillStyle = sospechoso.color;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // Desplazamiento del visor según su ángulo de movimiento
            const visorOffsetX = Math.cos(sospechoso.angulo) * 3;
            const visorOffsetY = Math.sin(sospechoso.angulo) * 2;

            // Visor oscuro
            ctx.beginPath();
            ctx.roundRect(-11 + visorOffsetX, -8 + visorOffsetY, 20, 12, 5);
            ctx.fillStyle = "#111111";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // Ojos / Mirada enojada dentro del visor
            ctx.fillStyle = "#ff2233";
            ctx.beginPath();
            ctx.arc(-4 + visorOffsetX, -2 + visorOffsetY, 2.2, 0, Math.PI * 2);
            ctx.arc(4 + visorOffsetX, -2 + visorOffsetY, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Pies / Patitas abajo
            ctx.beginPath();
            ctx.roundRect(-11, 16, 8, 7, 3);
            ctx.roundRect(3, 16, 8, 7, 3);
            ctx.fillStyle = sospechoso.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // Si está capturado, se dibuja la RED ENCIMA encerrándolo
            if (sospechoso.capturado) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#49cfff";
                ctx.shadowBlur = 12;
                ctx.strokeRect(-18, -16, 36, 42);
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }

        ctx.restore();
    }

    // =========================================================
    // DIBUJAR JUGADOR (Estilo Cuadrado Among Us / Visor Oscuro)
    // =========================================================
function dibujarJugador() {
        ctx.save();
        ctx.translate(jugador.x - camara.x, jugador.y - camara.y);

        const rebote = jugador.usandoRun
            ? Math.sin(tiempoAnimacion * 0.2) * 2
            : Math.sin(tiempoAnimacion * 0.12) * 3;

        // Sombra (siempre abajo y centrada)
        ctx.beginPath();
        ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();

        ctx.translate(0, rebote);

        // Arma / Red que porta el jugador orientada según el ángulo del mouse
        ctx.save();
        ctx.rotate(jugador.angulo);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.restore();

        // Cuerpo principal del jugador (FIJO, sin rotación, cabeza arriba)
        ctx.beginPath();
        ctx.roundRect(-14, -12, 28, 30, [10, 10, 6, 6]);
        ctx.fillStyle = jugador.cambiandoColor ? "#ffffff" : jugador.color;
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        // Visor oscuro (se desplaza levemente hacia el lado del ángulo para simular hacia dónde mira)
        const visorOffsetX = Math.cos(jugador.angulo) * 3;
        const visorOffsetY = Math.sin(jugador.angulo) * 2;

        ctx.beginPath();
        ctx.roundRect(-11 + visorOffsetX, -8 + visorOffsetY, 20, 12, 5);
        ctx.fillStyle = "#111111";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        // Brillo del visor
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-3 + visorOffsetX, -3 + visorOffsetY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Pies del jugador (fijos)
        ctx.beginPath();
        ctx.roundRect(-11, 16, 8, 7, 3);
        ctx.roundRect(3, 16, 8, 7, 3);
        ctx.fillStyle = jugador.cambiandoColor ? "#ffffff" : jugador.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        ctx.restore();
    }

    // =========================================================
    // DIBUJAR REDES (Proyectiles volando)
    // =========================================================

    function dibujarRedes() {
        ctx.save();
        ctx.translate(-camara.x, -camara.y);

        for (const red of redes) {
            ctx.save();
            ctx.translate(red.x, red.y);
            ctx.rotate(red.rotacion);
            ctx.scale(red.escala, red.escala);

            ctx.strokeStyle = "#eafaff";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#49cfff";
            ctx.shadowBlur = 10;

            const tamaño = 22;

            ctx.beginPath();
            ctx.moveTo(-tamaño, -tamaño);
            ctx.lineTo(tamaño, tamaño);
            ctx.moveTo(tamaño, -tamaño);
            ctx.lineTo(-tamaño, tamaño);
            ctx.moveTo(0, -tamaño);
            ctx.lineTo(0, tamaño);
            ctx.moveTo(-tamaño, 0);
            ctx.lineTo(tamaño, 0);
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }

    // =========================================================
    // DIBUJAR PARTÍCULAS
    // =========================================================

    function dibujarParticulas() {
        ctx.save();
        ctx.translate(-camara.x, -camara.y);

        for (const p of particulas) {
            ctx.globalAlpha = Math.max(0, p.vida / 60);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // =========================================================
    // PELIGRO EN PANTALLA
    // =========================================================

    function dibujarPeligro() {
        if (nivelPeligro <= 0) return;

        const gradiente = ctx.createRadialGradient(
            ancho / 2, alto / 2, Math.min(ancho, alto) * 0.25,
            ancho / 2, alto / 2, Math.max(ancho, alto) * 0.7
        );

        gradiente.addColorStop(0, "rgba(255,0,0,0)");
        gradiente.addColorStop(1, `rgba(255,0,0,${0.25 * nivelPeligro})`);

        ctx.fillStyle = gradiente;
        ctx.fillRect(0, 0, ancho, alto);
    }

    // =========================================================
    // RENDER
    // =========================================================

    function renderizar() {
        dibujarMapa();
        dibujarSospechosos();
        dibujarRedes();
        dibujarParticulas();
        dibujarJugador();
        dibujarPeligro();
    }

    // =========================================================
    // ACTUALIZAR PELIGRO
    // =========================================================

    function actualizarPeligro(delta) {
        let peligroObjetivo = 0;

        for (const sospechoso of sospechosos) {
            if (sospechoso.capturado || !sospechoso.esImpostor) continue;

            const d = distancia(jugador.x, jugador.y, sospechoso.x, sospechoso.y);
            if (sospechoso.objetivoJugador && d < 300) {
                peligroObjetivo = Math.max(peligroObjetivo, 1 - d / 300);
            }
        }

        // 🎵 EFECTO BACKROOMS / TENSIÓN DE ATAQUE:
        // Si el impostor se acerca y hay peligro alto, cambia a música de terror/Backrooms
        if (peligroObjetivo > 0.4) {
            if (typeof GestorAudio !== "undefined" && GestorAudio.suspenso) {
                GestorAudio.suspenso(); 
            }
        } else {
            // Si pasa el peligro, vuelve a la música rítmica de juego (estilo Pac-Man)
            if (typeof GestorAudio !== "undefined" && GestorAudio.juego) {
                GestorAudio.juego(); 
            }
        }

        nivelPeligro += (peligroObjetivo - nivelPeligro) * 0.08 * delta;
        nivelPeligro = limitar(nivelPeligro, 0, 1);
    }

    // =========================================================
    // TIMER
    // =========================================================

    function actualizarTiempo() {
        if (!juegoActivo) return;

        const ahora = Date.now();
        const transcurrido = Math.floor((ahora - tiempoInicio) / 1000);
        const restante = Math.max(0, tiempoPartida - transcurrido);

        const minutos = Math.floor(restante / 60);
        const segundos = restante % 60;

        const objetivoTexto = document.getElementById("objetivoTexto");
        if (objetivoTexto) {
            const segundosTexto = segundos.toString().padStart(2, "0");
            const corazones = "❤️".repeat(vidaJugador) + "🖤".repeat(vidaMaxima - vidaJugador);
            objetivoTexto.textContent = `TIEMPO ${minutos}:${segundosTexto} • IMPOSTORES ${impostoresRestantes} • ${corazones}`;
        }

        if (restante <= 0) {
            terminarJuego("¡Se terminó el tiempo!");
        }
    }

    // =========================================================
    // TERMINAR JUEGO
    // =========================================================

    function terminarJuego(motivo = "Partida terminada") {
        if (!juegoActivo) return;

        juegoActivo = false;
        juegoPausado = false;

        // 🎵 AGREGAR ESTO (Si las vidas llegaron a 0 o perdió por tiempo):
        if (vidaJugador <= 0 || motivo.includes("tiempo")) {
            GestorAudio.sfxPerder();
        }

        const resultadoPuntos = document.getElementById("resultadoPuntos");
        const resultadoCapturados = document.getElementById("resultadoCapturados");

        if (resultadoPuntos) resultadoPuntos.textContent = puntos;
        if (resultadoCapturados) resultadoCapturados.textContent = capturados;

        mostrarPantalla("pantallaFinal");
        mostrarNotificacion(motivo);
        console.log("🏁 FIN DE PARTIDA:", motivo);
    }

    /// =========================================================
    // INICIAR JUEGO
    // =========================================================

    function iniciarJuego() {
        puntos = 0;
        capturados = 0;
        vidaJugador = vidaMaxima;
        invulnerableHasta = 0;
        nivelPeligro = 0;
        
        iniciarCronometro(); // ⏱️ Arranca el reloj

        // 🎵 ASEGURAR QUE EL AUDIO SE DESPIERTE Y SUENE LA MÚSICA DE JUEGO:
        if (typeof GestorAudio !== "undefined") {
            if (GestorAudio.contexto && GestorAudio.contexto.state === 'suspended') {
                GestorAudio.contexto.resume();
            }
            GestorAudio.juego(); // Arranca la música estilo Pac-Man / Backrooms
            GestorAudio.sfxBoton();
        }

        jugador.x = mundo.ancho / 2;
        jugador.y = mundo.alto / 2;
        jugador.sospecha = 0;
        jugador.ultimaRed = 0;
        jugador.energiaRun = jugador.energiaRunMax;
        jugador.cambiandoColor = false;

        redes.length = 0;
        particulas.length = 0;

        generarSospechosos();

        tiempoInicio = Date.now();
        juegoActivo = true;
        juegoPausado = false;

        mostrarPantalla("pantallaJuego");
        actualizarHUD();
        console.log("🎮 PARTIDA INICIADA");
    }

    // =========================================================
    // PAUSA
    // =========================================================

    function alternarPausa() {
        if (!juegoActivo) return;

        juegoPausado = !juegoPausado;
        const menuPausa = document.getElementById("menuPausa");

        if (menuPausa) {
            if (juegoPausado) {
                menuPausa.classList.add("mostrar");
            } else {
                menuPausa.classList.remove("mostrar");
            }
        }
    }

    // =========================================================
    // PANTALLAS
    // =========================================================

    function ocultarTodasLasPantallas() {
        const pantallas = document.querySelectorAll(".pantalla");
        pantallas.forEach(pantalla => {
            pantalla.classList.remove("activa");
        });
    }

    function mostrarPantalla(id) {
        ocultarTodasLasPantallas();
        const pantalla = document.getElementById(id);
        if (pantalla) {
            pantalla.classList.add("activa");
        }
    }

    // =========================================================
    // SALA
    // =========================================================

    function generarCodigoSala() {
        const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let codigo = "";
        for (let i = 0; i < 6; i++) {
            codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
        }
        return codigo;
    }

    function crearSala() {
        const codigo = generarCodigoSala();
        const elemento = document.getElementById("codigoSala");
        if (elemento) {
            elemento.textContent = codigo;
        }
        mostrarPantalla("pantallaSala");
    }

    async function copiarCodigo() {
        const elemento = document.getElementById("codigoSala");
        if (!elemento) return;

        const codigo = elemento.textContent;
        try {
            await navigator.clipboard.writeText(codigo);
            mostrarNotificacion("📋 Código copiado");
        } catch (error) {
            mostrarNotificacion("No se pudo copiar");
        }
    }

    // =========================================================
    // NOTIFICACIONES
    // =========================================================

    function mostrarNotificacion(texto) {
        const notificacion = document.getElementById("notificacion");
        const notificacionTexto = document.getElementById("notificacionTexto");

        if (!notificacion) return;
        if (notificacionTexto) notificacionTexto.textContent = texto;

        notificacion.classList.add("mostrar");
        setTimeout(() => {
            notificacion.classList.remove("mostrar");
        }, 1800);
    }

    function volverMenu() {
        juegoActivo = false;
        juegoPausado = false;
        redes.length = 0;
        particulas.length = 0;
        mostrarPantalla("menuPrincipal");

        GestorAudio.menu();
    }



    // =========================================================
    // EVENTOS DE TECLADO Y MOUSE
    // =========================================================

    document.addEventListener("keydown", (event) => {
        const tecla = event.key.toLowerCase();

        if (tecla === "w" || event.key === "ArrowUp") TECLA.arriba = true;
        if (tecla === "s" || event.key === "ArrowDown") TECLA.abajo = true;
        if (tecla === "a" || event.key === "ArrowLeft") TECLA.izquierda = true;
        if (tecla === "d" || event.key === "ArrowRight") TECLA.derecha = true;
        if (tecla === "shift") TECLA.run = true;

        if (event.code === "Space") {
            event.preventDefault();
            lanzarRed();
        }

        if (tecla === "escape") {
            alternarPausa();
        }
    });

    document.addEventListener("keyup", (event) => {
        const tecla = event.key.toLowerCase();

        if (tecla === "w" || event.key === "ArrowUp") TECLA.arriba = false;
        if (tecla === "s" || event.key === "ArrowDown") TECLA.abajo = false;
        if (tecla === "a" || event.key === "ArrowLeft") TECLA.izquierda = false;
        if (tecla === "d" || event.key === "ArrowRight") TECLA.derecha = false;
        if (tecla === "shift") TECLA.run = false;
    });

    canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;

        mouse.mundoX = mouse.x + camara.x;
        mouse.mundoY = mouse.y + camara.y;

        jugador.angulo = Math.atan2(
            mouse.mundoY - jugador.y,
            mouse.mundoX - jugador.x
        );
    });

    canvas.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            mouse.presionado = true;
            lanzarRed();
        }
    });

    canvas.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            mouse.presionado = false;
        }
    });

    // --- CONTROLES TÁCTILES PARA CELULAR ---
    
    window.addEventListener('touchstart', (e) => {
        // Despierta el audio si está suspendido por políticas del celu
        if (typeof GestorAudio !== "undefined" && GestorAudio.contexto && GestorAudio.contexto.state === 'suspended') {
            GestorAudio.contexto.resume();
        }

        if (e.touches.length > 0) {
            const touch = e.touches[0];
            // Convertimos la posición del toque en coordenadas del mundo de juego
            const rect = canvas.getBoundingClientRect();
            const xClient = touch.clientX - rect.left;
            const yClient = touch.clientY - rect.top;

            // Actualizamos el ángulo del jugador hacia donde tocó el dedo
            jugador.angulo = Math.atan2(
                (yClient + camara.y) - jugador.y, 
                (xClient + camara.x) - jugador.x
            );
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const xClient = touch.clientX - rect.left;
            const yClient = touch.clientY - rect.top;

            // Actualiza la mira del jugador mientras arrastra el dedo por la pantalla
            jugador.angulo = Math.atan2(
                (yClient + camara.y) - jugador.y, 
                (xClient + camara.x) - jugador.x
            );
        }
    }, { passive: true });



    // =========================================================
    // ASOCIACIÓN DE BOTONES
    // =========================================================

    const vincularEvento = (id, evento, callback) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(evento, (e) => {
                // Al hacer cualquier clic, permitimos que el navegador reproduzca audio
                if (typeof GestorAudio !== "undefined" && GestorAudio.contexto && GestorAudio.contexto.state === 'suspended') {
                    GestorAudio.contexto.resume();
                }
                GestorAudio.sfxBoton(); 
                callback(e);
            });
        }
    };

    vincularEvento("btnJugar", "click", iniciarJuego);
    vincularEvento("btnCrearSala", "click", crearSala);
    vincularEvento("btnUnirseSala", "click", () => mostrarPantalla("pantallaUnirse"));
    vincularEvento("btnCopiarCodigo", "click", copiarCodigo);
    vincularEvento("btnIniciarPartida", "click", iniciarJuego);
    vincularEvento("btnVolverMenu", "click", volverMenu);
    vincularEvento("btnVolverUnirse", "click", () => mostrarPantalla("menuPrincipal"));
    vincularEvento("btnVolverFinal", "click", volverMenu);
    vincularEvento("btnContinuar", "click", alternarPausa);
    vincularEvento("btnSalirPartida", "click", volverMenu);

    vincularEvento("btnConfirmarUnirse", "click", () => {
        const input = document.getElementById("inputCodigoSala");
        if (!input || input.value.trim().length < 4) {
            mostrarNotificacion("Ingresá un código válido");
            return;
        }
        mostrarNotificacion("🔗 Conectando a la sala...");
        setTimeout(() => {
            iniciarJuego();
        }, 600);
    });

    window.addEventListener("resize", () => {
        ajustarCanvas();
        actualizarCamara();
    });

    // =========================================================
    // UTILIDADES
    // =========================================================

    function distancia(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function limitar(valor, minimo, maximo) {
        return Math.max(minimo, Math.min(maximo, valor));
    }

    // =========================================================
    // LOOP PRINCIPAL
    // =========================================================

    let ultimoTiempo = performance.now();

    function loop(tiempoActual) {
        const deltaMilisegundos = tiempoActual - ultimoTiempo;
        ultimoTiempo = tiempoActual;

        const delta = Math.min(deltaMilisegundos / 16.67, 2);
        tiempoAnimacion += delta;

        if (juegoActivo && !juegoPausado) {
            actualizarJugador(delta);
            actualizarSospechosos(delta);
            actualizarRedes(delta);
            actualizarParticulas(delta);
            actualizarPeligro(delta);
            actualizarCamara();
            actualizarTiempo();
            actualizarHUD();
        }

        renderizar();
        requestAnimationFrame(loop);
    }

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================

    mostrarPantalla("menuPrincipal");
    GestorAudio.menu();
    actualizarHUD();
    requestAnimationFrame(loop);

    console.log("✅ NET HUNTERS listo");

});