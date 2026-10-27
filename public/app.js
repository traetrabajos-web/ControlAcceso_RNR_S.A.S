/**
 * SentinelPro Access & IAM — Lógica de Frontend SPA
 * Control de Acceso Físico en Portería (Vigilante), Asistencia de Trabajadores,
 * Terminal Kiosco y Centro de Control IAM con Permisos Granulares.
 */

let CURRENT_USER = null;
let AUTH_TOKEN = localStorage.getItem('sentinelpro_token') || null;
let SYSTEM_DATA = null;
let SELECTED_GUARD_WORKER = null;
let SELECTED_IAM_USER_ID = null;

// ============================================================================
// 1. INICIALIZACIÓN Y NAVEGACIÓN PRINCIPAL
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    startDigitalClock();
    await loadPublicBootstrap();
    if (AUTH_TOKEN) {
        await restoreAdminSession();
    }
});

function startDigitalClock() {
    function update() {
        const now = new Date();
        const elTime = document.getElementById('live-digital-clock');
        const elDate = document.getElementById('live-digital-date');
        if (elTime) {
            elTime.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
        if (elDate) {
            const f = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            elDate.textContent = f.charAt(0).toUpperCase() + f.slice(1);
        }
    }
    update();
    setInterval(update, 1000);
}

// Estado del Kiosco (puerta única)
const KIOSK = {
    perfil: null,          // perfil identificado (GET /kiosco/identificar)
    identCargado: '',      // cédula del perfil cargado
    debounce: null,
    resetTimer: null,
    countdownTimer: null,
    busy: false
};

function pressKioscoKey(key) {
    const input = document.getElementById('kiosco-id');
    if (!input) return;
    if (key === 'OK') {
        kioskPrimaryAction();
        return;
    }
    if (key === 'CLEAR') {
        input.value = '';
    } else if (key === 'BACK') {
        input.value = input.value.slice(0, -1);
    } else if (input.value.length < 15) {
        input.value += key;
    }
    input.focus();
    onKioskInputChange();
}

function setKioscoId(val) {
    const input = document.getElementById('kiosco-id');
    if (!input) return;
    input.value = val;
    input.focus();
    identifyKioskWorker();
}

function playAudioCue(success = true) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (success) {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    } catch {
        // Fallback si Web Audio no está habilitado
    }
}

function switchMainView(viewName) {
    const pub = document.getElementById('view-public');
    const adm = document.getElementById('view-admin');
    const btnPub = document.getElementById('btn-view-public');
    const btnAdm = document.getElementById('btn-view-admin');

    if (viewName === 'public') {
        pub.classList.remove('hidden');
        adm.classList.add('hidden');
        btnPub.classList.add('active');
        btnAdm.classList.remove('active');
        loadPublicBootstrap();
    } else {
        pub.classList.add('hidden');
        adm.classList.remove('hidden');
        btnPub.classList.remove('active');
        btnAdm.classList.add('active');

        if (CURRENT_USER) {
            document.getElementById('admin-login-card').classList.add('hidden');
            document.getElementById('admin-workspace').classList.remove('hidden');
            loadAdminDashboardData();
        } else {
            document.getElementById('admin-login-card').classList.remove('hidden');
            document.getElementById('admin-workspace').classList.add('hidden');
        }
    }
}

function scrollToElement(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// 2. PORTAL CORPORATIVO & TERMINAL KIOSCO (PÚBLICO)
// ============================================================================
async function loadPublicBootstrap() {
    try {
        const res = await fetch('/api/public/bootstrap');
        const data = await res.json();
        SYSTEM_DATA = data;

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        if (data.resumen_planta) {
            setText('kx-kpi-dentro', data.resumen_planta.aforo_actual);
            setText('kx-kpi-entradas', data.resumen_planta.entradas_hoy);
            setText('kx-kpi-salidas', data.resumen_planta.salidas_hoy);
            setText('kx-kpi-visitas', data.resumen_planta.visitantes_en_planta);
        }
        setText('kx-kpi-tardanzas', data.tardanzas_hoy || 0);
        if (data.puerta_unica) {
            setText('kx-door-name', String(data.puerta_unica.nombre || 'Portería Principal').replace(/\s*\(.*\)\s*$/, ''));
        }
        setText('kx-date', new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

        if (data.horario_hoy) {
            const h = data.horario_hoy;
            const schedEl = document.getElementById('kiosco-today-schedule');
            if (schedEl) {
                schedEl.innerHTML = h.es_jornada_extra
                    ? `<strong>${h.dia}</strong> · Jornada extraordinaria (solo personal de patio autorizado)`
                    : `<strong>${h.dia}</strong> · ${h.entrada} – ${h.salida} · Almuerzo ${h.inicio_almuerzo || '12:00'}–${h.fin_almuerzo || '13:00'} · <strong>${h.horas_ordinarias} h</strong>`;
            }
        }

        renderKioskFeed(data.ultimos_movimientos || []);
        const typedId = (document.getElementById('kiosco-id')?.value || '').trim();
        if (!KIOSK.perfil && !KIOSK.resetTimer && !typedId) renderKioskIdle();
    } catch (err) {
        console.error('Error cargando bootstrap público:', err);
    }
}

function kxEscape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function kxInitials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function kxAvatar(t, cls = 'kx-avatar') {
    const initials = kxEscape(kxInitials(t.nombre_completo || t.nombre));
    if (t.foto_url) {
        return `<div class="${cls}"><img src="${kxEscape(t.foto_url)}" alt="" onerror="this.parentNode.textContent='${initials}'"></div>`;
    }
    return `<div class="${cls}">${initials}</div>`;
}

function kxFormatMinutes(min) {
    if (min === null || min === undefined) return '';
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

function kxTipoPersonal(tp) {
    return { PATIO: 'Operativo · Patio', ADMINISTRACION: 'Administrativo', APRENDIZ_SENA: 'Aprendiz SENA' }[tp] || tp || '—';
}

function setKioskDisplayState(text, tone) {
    const st = document.getElementById('kx-display-state');
    const box = document.getElementById('kx-display');
    if (st) st.textContent = text;
    if (box) box.dataset.tone = tone || '';
}

function onKioskInputChange() {
    const input = document.getElementById('kiosco-id');
    const val = (input?.value || '').trim();
    clearTimeout(KIOSK.debounce);
    if (KIOSK.perfil && val !== KIOSK.identCargado) {
        KIOSK.perfil = null;
        KIOSK.identCargado = '';
        renderKioskIdle();
    }
    if (val.length >= 6) {
        setKioskDisplayState('Identificando…', 'busy');
        KIOSK.debounce = setTimeout(identifyKioskWorker, 650);
    } else {
        setKioskDisplayState(val ? 'Digitando' : 'Esperando', '');
    }
}

function kioskPrimaryAction() {
    const val = (document.getElementById('kiosco-id')?.value || '').trim();
    if (KIOSK.perfil && val === KIOSK.identCargado && KIOSK.perfil.puede_marcar) {
        confirmKioskMovement();
    } else {
        identifyKioskWorker();
    }
}

async function identifyKioskWorker() {
    clearTimeout(KIOSK.debounce);
    clearKioskTimers();
    const ident = (document.getElementById('kiosco-id')?.value || '').trim();
    if (!ident) {
        setKioskDisplayState('Digite su cédula', 'error');
        playAudioCue(false);
        return;
    }
    setKioskDisplayState('Identificando…', 'busy');
    try {
        const res = await fetch(`/api/public/kiosco/identificar?identificador=${encodeURIComponent(ident)}`);
        const data = await res.json();
        if ((document.getElementById('kiosco-id')?.value || '').trim() !== ident) return; // el usuario siguió digitando
        if (!res.ok) {
            KIOSK.perfil = null;
            KIOSK.identCargado = '';
            setKioskDisplayState('No registrada', 'error');
            renderKioskDenied(null, data.error || 'Cédula no encontrada.', 'Verifique el número o acérquese a la garita.');
            playAudioCue(false);
            scheduleKioskReset(7);
            return;
        }
        KIOSK.perfil = data;
        KIOSK.identCargado = ident;
        setKioskDisplayState(data.puede_marcar ? 'Identificado' : 'Bloqueado', data.puede_marcar ? 'ok' : 'error');
        renderKioskProfile(data);
        if (!data.puede_marcar) playAudioCue(false);
        scheduleKioskReset(25, false);
    } catch (err) {
        setKioskDisplayState('Sin conexión', 'error');
        renderKioskDenied(null, 'Sin conexión con el servidor de portería.', 'Informe al vigilante de garita.');
    }
}

async function confirmKioskMovement() {
    if (!KIOSK.perfil || KIOSK.busy) return;
    KIOSK.busy = true;
    clearKioskTimers();
    const tipo = KIOSK.perfil.accion_sugerida;
    const btn = document.getElementById('kx-confirm-btn');
    if (btn) { btn.disabled = true; btn.querySelector('.kx-btn-main').textContent = 'Registrando…'; }
    try {
        const res = await fetch('/api/public/kiosco/marcar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador: KIOSK.identCargado, tipo_movimiento: tipo, metodo_identificacion: 'TERMINAL_KIOSCO_PIN' })
        });
        const data = await res.json();
        if (res.ok) {
            playAudioCue(true);
            renderKioskResult(data, tipo);
            setKioskDisplayState('Registrado', 'ok');
        } else {
            playAudioCue(false);
            renderKioskDenied(data.perfil?.trabajador || KIOSK.perfil.trabajador, data.error || 'No se pudo registrar.', 'Acérquese al vigilante de garita.');
            setKioskDisplayState('Rechazado', 'error');
        }
        document.getElementById('kiosco-id').value = '';
        KIOSK.perfil = null;
        KIOSK.identCargado = '';
        loadPublicBootstrap();
        scheduleKioskReset(res.ok ? 5 : 7);
    } catch (err) {
        renderKioskDenied(null, 'Error de conexión con el servidor de portería.', 'Intente nuevamente.');
    } finally {
        KIOSK.busy = false;
    }
}

function cancelKioskProfile() {
    document.getElementById('kiosco-id').value = '';
    KIOSK.perfil = null;
    KIOSK.identCargado = '';
    clearKioskTimers();
    setKioskDisplayState('Esperando', '');
    renderKioskIdle();
    document.getElementById('kiosco-id').focus();
}

function clearKioskTimers() {
    clearTimeout(KIOSK.resetTimer);
    clearInterval(KIOSK.countdownTimer);
    KIOSK.resetTimer = null;
    KIOSK.countdownTimer = null;
}

function scheduleKioskReset(seconds, showBar = true) {
    clearKioskTimers();
    const bar = document.getElementById('kx-countdown');
    let left = seconds;
    if (bar && showBar) {
        bar.style.transition = 'none';
        bar.style.width = '100%';
        requestAnimationFrame(() => {
            bar.style.transition = `width ${seconds}s linear`;
            bar.style.width = '0%';
        });
    }
    const label = document.getElementById('kx-countdown-label');
    KIOSK.countdownTimer = setInterval(() => {
        left -= 1;
        if (label) label.textContent = `La pantalla se reinicia en ${Math.max(left, 0)} s`;
    }, 1000);
    KIOSK.resetTimer = setTimeout(() => {
        KIOSK.resetTimer = null;
        cancelKioskProfile();
    }, seconds * 1000);
}

// ---------------------------------------------------------------------------
// Render de los estados del panel dinámico
// ---------------------------------------------------------------------------
function renderKioskIdle() {
    const box = document.getElementById('kx-profile');
    if (!box) return;
    box.dataset.state = 'idle';
    box.innerHTML = `
        <div class="kx-idle">
            <div class="kx-idle-badge">♻️ Control de Acceso Oficial</div>
            <div class="kx-idle-icon">
                <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                </svg>
            </div>
            <h3>Bienvenido al sistema de control de acceso</h3>
            <p>Ingresa tu número de identificación para registrar tu movimiento.</p>

            <div class="kx-steps-grid">
                <div class="kx-step-item">
                    <span class="kx-step-num">1</span>
                    <strong>Identificación</strong>
                    <small>Digita tu cédula o escanea tu carnet</small>
                </div>
                <div class="kx-step-item">
                    <span class="kx-step-num">2</span>
                    <strong>Validación</strong>
                    <small>Verifica tu cargo y cobertura SST / ARL</small>
                </div>
                <div class="kx-step-item">
                    <span class="kx-step-num">3</span>
                    <strong>Registro</strong>
                    <small>Confirma tu entrada o salida</small>
                </div>
            </div>

            <div class="kx-idle-info-box">
                <div class="kx-info-item">
                    <strong>📍 Sede Industrial Mamonal</strong>
                    <span>Puerta 1 · Garita Principal Peatonal</span>
                </div>
                <div class="kx-info-item">
                    <strong>⚖️ Jornada Legal 42 Horas</strong>
                    <span>Lunes a Viernes · Ley 2101 de 2021</span>
                </div>
            </div>
        </div>`;
}

function renderKioskProfile(p) {
    const box = document.getElementById('kx-profile');
    const t = p.trabajador;
    const dentro = t.ubicacion_actual === 'DENTRO_PLANTA';
    const esEntrada = p.accion_sugerida === 'ENTRADA';
    const ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

    const estadoActual = dentro
        ? `<div class="kx-presence kx-in"><i></i>Dentro de la planta desde <strong>${kxEscape(p.registro_abierto?.hora_entrada || (t.ultima_entrada || '').split(' ')[1] || '—')}</strong>${p.minutos_en_planta !== null ? ` · ${kxFormatMinutes(p.minutos_en_planta)} transcurridos` : ''}</div>`
        : `<div class="kx-presence kx-out"><i></i>Fuera de la planta · Corresponde registrar ENTRADA</div>`;

    const checks = p.validaciones.map(v => `
        <li class="${v.ok ? 'ok' : 'fail'}">
            <span class="kx-check">${v.ok
                ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>'
                : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>'}</span>
            <div><strong>${kxEscape(v.etiqueta)}</strong><small>${kxEscape(v.detalle)}</small></div>
        </li>`).join('');

    const historial = p.historial_hoy.length
        ? p.historial_hoy.map(h => `<span class="kx-chip">${kxEscape(h.hora_entrada)} → ${kxEscape(h.hora_salida || 'en curso')}</span>`).join('')
        : '<span class="kx-muted">Sin registros hoy</span>';

    const action = p.puede_marcar
        ? `<button id="kx-confirm-btn" class="kx-btn ${esEntrada ? 'kx-btn-in' : 'kx-btn-out'}" onclick="confirmKioskMovement()">
                <span class="kx-btn-main">Confirmar ${esEntrada ? 'ENTRADA' : 'SALIDA'}</span>
                <span class="kx-btn-sub">Registro oficial a las ${ahora} · Puerta 1</span>
           </button>`
        : `<div class="kx-blocked">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>
                <div><strong>Ingreso no autorizado</strong><span>${kxEscape(p.motivo_bloqueo)}. Consulta con el supervisor de garita.</span></div>
           </div>`;

    box.dataset.state = p.puede_marcar ? 'profile' : 'blocked';
    box.innerHTML = `
        <div class="kx-person">
            ${kxAvatar(t, 'kx-avatar kx-avatar-lg')}
            <div class="kx-person-main">
                <span class="kx-overline">${kxEscape(t.codigo_credencial)} · CC ${kxEscape(Number(t.documento).toLocaleString('es-CO'))}</span>
                <h3>${kxEscape(t.nombre_completo)}</h3>
                <div class="kx-role">${kxEscape(t.cargo)}</div>
                <div class="kx-tags">
                    <span class="kx-tag">${kxEscape(t.departamento)}</span>
                    <span class="kx-tag">${kxEscape(kxTipoPersonal(t.tipo_personal))}</span>
                    ${t.es_puesto_critico ? '<span class="kx-tag kx-tag-crit">Puesto crítico</span>' : ''}
                    ${t.estado !== 'ACTIVO' ? `<span class="kx-tag kx-tag-bad">${kxEscape(t.estado)}</span>` : ''}
                </div>
            </div>
        </div>
        ${estadoActual}
        <div class="kx-section-title">Validación de Requisitos SST & Horario</div>
        <ul class="kx-checks">${checks}</ul>
        <div class="kx-history"><span class="kx-section-title">Movimientos de hoy</span>${historial}</div>
        <div class="kx-actions">
            ${action}
            <button class="kx-btn-ghost" onclick="cancelKioskProfile()">${p.puede_marcar ? 'Cancelar / No soy yo' : 'Volver'}</button>
        </div>
        <div class="kx-countdown-wrap"><div class="kx-countdown" id="kx-countdown"></div></div>`;
}

function renderKioskResult(data, tipo) {
    const box = document.getElementById('kx-profile');
    const t = data.perfil?.trabajador || data.trabajador || {};
    const r = data.registro || {};
    const esEntrada = tipo === 'ENTRADA';
    const estado = String(r.estado_asistencia || '');
    const tono = !esEntrada ? 'out' : (estado.startsWith('TARDANZA') ? 'late' : 'in');
    const tituloMovimiento = esEntrada ? 'Entrada registrada correctamente' : 'Salida registrada correctamente';
    const estadoTxt = esEntrada
        ? (estado.startsWith('TARDANZA') ? `Registro con novedad: ${estado}` : (estado === 'EXTRAORDINARIA' ? 'Jornada extraordinaria autorizada' : 'Entrada puntual autorizada · Cobertura SST al día'))
        : `Jornada finalizada · Tiempo laborado: ${r.horas_formateadas || 'Completado'}`;
    const nombreCorto = String(t.nombre_completo || '').split(' ')[0];

    box.dataset.state = 'result-' + tono;
    box.innerHTML = `
        <div class="kx-result kx-result-${tono}">
            <div class="kx-result-icon">
                <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg>
            </div>
            <span class="kx-overline">${tituloMovimiento}</span>
            <div class="kx-result-time">${kxEscape(esEntrada ? r.hora_entrada : r.hora_salida)}</div>
            <h3>${esEntrada ? `¡Bienvenido, ${kxEscape(nombreCorto)}!` : `¡Hasta luego, ${kxEscape(nombreCorto)}!`}</h3>
            <p class="kx-result-status">${kxEscape(estadoTxt)}</p>
            <div class="kx-result-card">
                ${kxAvatar(t)}
                <div>
                    <strong>${kxEscape(t.nombre_completo)}</strong>
                    <span>${kxEscape(t.cargo)} · ${kxEscape(t.departamento)}</span>
                </div>
                <div class="kx-result-meta">
                    <span>Entrada: <b>${kxEscape(r.hora_entrada || '—')}</b></span>
                    ${!esEntrada ? `<span>Salida: <b>${kxEscape(r.hora_salida || '—')}</b></span>` : ''}
                </div>
            </div>
            <div class="kx-countdown-wrap"><div class="kx-countdown" id="kx-countdown"></div></div>
            <p class="kx-muted" id="kx-countdown-label">Regresando al inicio en 5 s</p>
            <button class="kx-btn-ghost-sm" onclick="cancelKioskProfile()">Siguiente trabajador ›</button>
        </div>`;
}

function renderKioskDenied(trabajador, mensaje, ayuda) {
    const box = document.getElementById('kx-profile');
    box.dataset.state = 'denied';
    box.innerHTML = `
        <div class="kx-result kx-result-denied">
            <div class="kx-result-icon">
                <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            </div>
            <span class="kx-overline">Operación no completada</span>
            <h3>${kxEscape(mensaje)}</h3>
            <p class="kx-result-status">${kxEscape(ayuda || 'Por favor verifica tu información o consulta con el personal de portería.')}</p>
            ${trabajador ? `<div class="kx-result-card">${kxAvatar(trabajador)}<div><strong>${kxEscape(trabajador.nombre_completo)}</strong><span>${kxEscape(trabajador.cargo || '')} · ${kxEscape(trabajador.departamento || '')}</span></div></div>` : ''}
            <div class="kx-countdown-wrap"><div class="kx-countdown" id="kx-countdown"></div></div>
            <p class="kx-muted" id="kx-countdown-label">Regresando al inicio en 6 s</p>
            <button class="kx-btn-ghost" onclick="cancelKioskProfile()">Intentar nuevamente</button>
        </div>`;
}

// ---------------------------------------------------------------------------
// Filtro y render de Movimientos Recientes
// ---------------------------------------------------------------------------
let CURRENT_FEED_FILTER = 'TODOS';
let ALL_FEED_MOVIMIENTOS = [];

function setFeedFilter(filter) {
    CURRENT_FEED_FILTER = filter;
    document.querySelectorAll('.kx-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    applyFeedFilter();
}

function applyFeedFilter() {
    let items = ALL_FEED_MOVIMIENTOS;
    if (CURRENT_FEED_FILTER !== 'TODOS') {
        items = items.filter(m => m.tipo === CURRENT_FEED_FILTER);
    }
    renderFilteredKioskFeed(items);
}

function renderKioskFeed(items) {
    ALL_FEED_MOVIMIENTOS = Array.isArray(items) ? items : [];
    applyFeedFilter();
}

function renderFilteredKioskFeed(items) {
    const ul = document.getElementById('kx-feed-list');
    if (!ul) return;
    if (!items.length) {
        ul.innerHTML = `<li class="kx-feed-empty">${CURRENT_FEED_FILTER === 'TODOS' ? 'Sin movimientos registrados hoy.' : `No hay registros de ${CURRENT_FEED_FILTER.toLowerCase()}s hoy.`}</li>`;
        return;
    }
    ul.innerHTML = items.map(m => `
        <li>
            ${kxAvatar(m, 'kx-avatar kx-avatar-sm')}
            <div class="kx-feed-main">
                <strong>${kxEscape(m.nombre)}</strong>
                <span>${kxEscape(m.cargo || '')}</span>
            </div>
            <div class="kx-feed-meta">
                <span class="kx-pill ${m.tipo === 'ENTRADA' ? (String(m.estado).startsWith('TARDANZA') ? 'kx-pill-late' : 'kx-pill-in') : 'kx-pill-out'}">
                    ${m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                </span>
                <time>${kxEscape(m.hora)}</time>
            </div>
        </li>`).join('');
}

// Teclado físico / lector de código de barras
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('kiosco-id');
    if (!input) return;
    input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9A-Za-z-]/g, '');
        onKioskInputChange();
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); kioskPrimaryAction(); }
        if (e.key === 'Escape') cancelKioskProfile();
    });
    renderKioskIdle();
    input.focus();
    // Actualización automática en tiempo real de trazabilidad y KPIs (cada 3.5 segundos)
    setInterval(() => {
        if (!document.getElementById('view-public')?.classList.contains('hidden')) {
            loadPublicBootstrap();
        }
    }, 3500);
});

function showFeedback(el, message, type) {
    el.textContent = message;
    el.className = `feedback-box ${type}`;
    el.classList.remove('hidden');
}

// Modal Consulta de Credencial
function openCredentialModal() {
    document.getElementById('modal-credential').classList.remove('hidden');
    document.getElementById('modal-cred-input').focus();
}

function closeCredentialModal() {
    document.getElementById('modal-credential').classList.add('hidden');
    document.getElementById('modal-cred-result').classList.add('hidden');
}

async function queryCredentialPublic() {
    const q = document.getElementById('modal-cred-input').value.trim();
    const box = document.getElementById('modal-cred-result');
    if (!q) return;

    try {
        const res = await fetch(`/api/public/consultar-credencial?identificador=${encodeURIComponent(q)}`);
        const data = await res.json();

        if (res.ok) {
            const t = data.trabajador;
            const turno = data.turno_asignado ? `${data.turno_asignado.nombre} (${data.turno_asignado.hora_entrada} a ${data.turno_asignado.hora_salida})` : 'Estándar';
            const estadoBadge = t.estado === 'ACTIVO' 
                ? '<span class="badge badge-success">ACTIVO</span>' 
                : '<span class="badge badge-danger">SUSPENDIDO</span>';
            const ubicacionBadge = t.ubicacion_actual === 'DENTRO_PLANTA' 
                ? '<span class="badge badge-info">DENTRO DE LA EMPRESA</span>' 
                : '<span class="badge badge-neutral">FUERA DE PLANTA</span>';

            box.innerHTML = `
                <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #cbd5e1;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <h4 style="margin:0;">${t.nombre_completo} (${t.codigo_credencial})</h4>
                        <div>${estadoBadge} ${ubicacionBadge}</div>
                    </div>
                    <p style="margin:4px 0;font-size:0.86rem;"><strong>Cargo:</strong> ${t.cargo} | <strong>Departamento:</strong> ${t.departamento}</p>
                    <p style="margin:4px 0;font-size:0.86rem;"><strong>Turno:</strong> ${turno}</p>
                    <p style="margin:4px 0;font-size:0.86rem;"><strong>Última Marcación:</strong> ${t.ultima_entrada}</p>
                    <div style="margin-top:10px;">
                        <strong style="font-size:0.82rem;text-transform:uppercase;color:#475569;">Puertas Físicas Autorizadas:</strong>
                        <ul style="margin:6px 0 0 18px;font-size:0.84rem;">
                            ${data.zonas_autorizadas_detalle.map(z => `<li>${z}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            box.classList.remove('hidden');
        } else {
            box.innerHTML = `<div class="feedback-box error">${data.error}</div>`;
            box.classList.remove('hidden');
        }
    } catch (err) {
        box.innerHTML = `<div class="feedback-box error">Error al consultar el servidor.</div>`;
        box.classList.remove('hidden');
    }
}

// ============================================================================
// 3. AUTENTICACIÓN Y CONTROL DE SESIÓN (IAM)
// ============================================================================
function quickLogin(email, pass) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value = pass;
    submitLogin(false);
}

function toggleLoginPasswordVisibility() {
    const pass = document.getElementById('login-pass');
    if (!pass) return;
    pass.type = pass.type === 'password' ? 'text' : 'password';
}

async function submitLogin(forceReplace = false) {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value.trim();
    const conflictBox = document.getElementById('conflict-box');
    const conflictText = document.getElementById('conflict-text');
    const errorBox = document.getElementById('login-error-msg');
    const btnSubmit = document.getElementById('btn-submit-login');

    if (conflictBox) conflictBox.classList.add('hidden');
    if (errorBox) {
        errorBox.textContent = '';
        errorBox.classList.add('hidden');
    }

    if (!email || !password) {
        if (errorBox) {
            errorBox.textContent = 'Por favor ingresa tu correo y contraseña.';
            errorBox.classList.remove('hidden');
        }
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Autenticando...';
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                force_replace: forceReplace,
                dispositivo: `SentinelPro Web Client (${navigator.userAgent.slice(0, 50)})`
            })
        });

        const data = await res.json();

        if (res.status === 409) {
            // Reemplazo transparente de sesión previa (política CERRAR_ANTERIOR)
            return submitLogin(true);
        }

        if (res.ok) {
            AUTH_TOKEN = data.token;
            CURRENT_USER = data.usuario;
            localStorage.setItem('sentinelpro_token', AUTH_TOKEN);

            document.getElementById('admin-login-card').classList.add('hidden');
            document.getElementById('admin-workspace').classList.remove('hidden');

            applyUserNavigationPermissions();
            loadAdminDashboardData();
        } else {
            if (errorBox) {
                errorBox.textContent = data.error || 'Credenciales no autorizadas. Verifica tu correo y contraseña.';
                errorBox.classList.remove('hidden');
            } else {
                alert(data.error || 'Credenciales no autorizadas.');
            }
        }
    } catch (err) {
        if (errorBox) {
            errorBox.textContent = 'Error al conectar con el servidor de seguridad.';
            errorBox.classList.remove('hidden');
        } else {
            alert('Error conectando al servidor de seguridad.');
        }
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Entrar al Panel de Control';
        }
    }
}

async function restoreAdminSession() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();
        if (res.ok) {
            CURRENT_USER = data.usuario;
            applyUserNavigationPermissions();
        } else {
            AUTH_TOKEN = null;
            localStorage.removeItem('sentinelpro_token');
        }
    } catch {
        AUTH_TOKEN = null;
        localStorage.removeItem('sentinelpro_token');
    }
}

async function logoutAdmin() {
    try {
        if (AUTH_TOKEN) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
        }
    } finally {
        AUTH_TOKEN = null;
        CURRENT_USER = null;
        localStorage.removeItem('sentinelpro_token');
        document.getElementById('admin-login-card').classList.remove('hidden');
        document.getElementById('admin-workspace').classList.add('hidden');
    }
}

// Ocultamiento / Muestra reactiva de pestañas en el Sidebar según permisos_mapa del usuario
function applyUserNavigationPermissions() {
    if (!CURRENT_USER) return;

    // Perfil en el Sidebar
    document.getElementById('sidebar-user-name').textContent = CURRENT_USER.nombre_completo;
    document.getElementById('sidebar-user-role').textContent = CURRENT_USER.rol_nombre || CURRENT_USER.rol;
    document.getElementById('sidebar-user-role').style.backgroundColor = CURRENT_USER.rol_color || '#3730a3';
    document.getElementById('sidebar-avatar').textContent = (CURRENT_USER.nombre_completo || 'U')[0].toUpperCase();
    document.getElementById('sidebar-perm-count').textContent = `${CURRENT_USER.permisos_lista?.length || 0} permisos activos`;

    // Barra superior
    document.getElementById('bar-user-email').textContent = CURRENT_USER.email;
    document.getElementById('bar-user-role').textContent = CURRENT_USER.rol_nombre || CURRENT_USER.rol;

    const perms = CURRENT_USER.permisos_mapa || {};
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    let firstVisibleTab = null;

    navButtons.forEach(btn => {
        const reqPerm = btn.getAttribute('data-perm');
        // Si el usuario tiene el permiso, mostrar botón; de lo contrario, ocultarlo en interfaz
        if (perms[reqPerm]) {
            btn.style.display = 'flex';
            if (!firstVisibleTab) firstVisibleTab = btn.getAttribute('data-tab');
        } else {
            btn.style.display = 'none';
        }
    });

    if (firstVisibleTab) {
        showTab(firstVisibleTab);
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(tb => tb.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId === 'tab-iam') {
        loadIamModuleData();
    } else if (tabId === 'tab-patio') {
        loadPatioCuadrilla();
    } else if (tabId === 'tab-nomina') {
        loadNominaReport();
    }
}

// ============================================================================
// 4. CARGA DE DATOS DEL PANEL ADMINISTRATIVO
// ============================================================================
let DASHBOARD_DATA = null;

async function loadAdminDashboardData() {
    if (!AUTH_TOKEN) return;

    try {
        const res = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) logoutAdmin();
            return;
        }

        DASHBOARD_DATA = data;

        // Actualizar KPIs
        if (data.kpis) {
            document.getElementById('kpi-en-planta').textContent = data.kpis.en_planta_ahora;
            document.getElementById('kpi-entradas-hoy').textContent = data.kpis.entradas_hoy;
            document.getElementById('kpi-salidas-hoy').textContent = data.kpis.salidas_hoy;
            document.getElementById('kpi-tardanzas-hoy').textContent = data.kpis.tardanzas_hoy;
            document.getElementById('kpi-puntuales-hoy').textContent = `${data.kpis.puntuales_hoy} puntuales`;
            document.getElementById('kpi-visitantes-hoy').textContent = data.kpis.visitantes_en_planta;

            const pct = Math.round((data.kpis.en_planta_ahora / (data.kpis.aforo_maximo || 150)) * 100);
            document.getElementById('kpi-aforo-pct').textContent = `${pct}% de aforo (${data.kpis.aforo_maximo} máx)`;
        }

        renderEnPlantaTable(data.trabajadores_en_planta || []);
        renderGuardConsole(data);
        renderAttendanceTable(data.registros_acceso || []);
        renderWorkersCrudTable(data.trabajadores || []);
        renderVisitorsTable(data.visitantes || []);
        renderZonasTable(data.zonas_acceso || []);
        renderTurnosTable(data.turnos_laborales || []);
        renderAlertasTable(data.incidencias_acceso || []);
        populateConfigForm(data.configuracion_empresa);

    } catch (err) {
        console.error('Error cargando datos del panel:', err);
    }
}

// TAB 1: Tabla de Personal Actualmente en Planta
function renderEnPlantaTable(trabajadores) {
    const tbody = document.querySelector('#table-en-planta tbody');
    document.getElementById('count-en-planta').textContent = trabajadores.length;

    if (!trabajadores.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:18px;">No hay personal registrado en planta en este momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = trabajadores.map(t => `
        <tr>
            <td><strong>${t.codigo_credencial}</strong></td>
            <td>${t.nombre_completo}</td>
            <td>${t.departamento}</td>
            <td>${t.ultima_entrada || '--'}</td>
            <td>Puerta ${t.ultima_puerta_id || 1}</td>
            <td><span class="badge badge-success">EN PLANTA</span></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="quickRegisterExitFromTable(${t.id}, '${t.nombre_completo}')">
                    🔴 Fichar Salida
                </button>
            </td>
        </tr>
    `).join('');
}

async function quickRegisterExitFromTable(workerId, name) {
    if (!confirm(`¿Registrar la salida de ${name} en este momento?`)) return;

    try {
        const res = await fetch('/api/admin/porteria/registrar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identificador: workerId,
                tipo_movimiento: 'SALIDA',
                zona_id: 1,
                observacion: 'Salida rápida fichada desde el Monitor de Planta'
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            loadAdminDashboardData();
        } else {
            alert(data.error || 'No se pudo registrar la salida.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

// TAB 2: Consola de Portería (Vigilante)
function renderGuardConsole(data) {
    const sel = document.getElementById('guard-puerta-select');
    if (sel && data.zonas_acceso) {
        sel.innerHTML = data.zonas_acceso.map(z => `
            <option value="${z.id}">${z.codigo}: ${z.nombre} (${z.nivel_seguridad})</option>
        `).join('');
    }

    // Tabla de movimientos recientes
    const tbody = document.querySelector('#table-guard-recent tbody');
    const recents = (data.registros_acceso || []).slice(0, 6);

    if (!recents.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin movimientos registrados hoy.</td></tr>`;
        return;
    }

    tbody.innerHTML = recents.map(r => `
        <tr>
            <td><strong>${r.hora_salida ? r.hora_salida : r.hora_entrada}</strong></td>
            <td>${r.hora_salida ? '<span class="badge badge-danger">SALIDA</span>' : '<span class="badge badge-success">ENTRADA</span>'}</td>
            <td>${r.trabajador_nombre}</td>
            <td>${r.zona_nombre.split('(')[0]}</td>
            <td>${r.estado_asistencia === 'PUNTUAL' ? '<span class="badge badge-success">Puntual</span>' : '<span class="badge badge-warning">Tardanza</span>'}</td>
        </tr>
    `).join('');
}

function searchWorkerInGuard() {
    const q = document.getElementById('guard-worker-search').value.trim().toUpperCase();
    const preview = document.getElementById('guard-worker-preview');
    const feedback = document.getElementById('guard-feedback');

    feedback.classList.add('hidden');
    if (!q || !DASHBOARD_DATA || !DASHBOARD_DATA.trabajadores) return;

    const trab = DASHBOARD_DATA.trabajadores.find(t => 
        String(t.codigo_credencial).toUpperCase() === q ||
        String(t.documento).toUpperCase() === q ||
        t.nombre_completo.toUpperCase().includes(q)
    );

    if (!trab) {
        preview.classList.add('hidden');
        showFeedback(feedback, `No se encontró ningún trabajador con "${q}".`, 'error');
        SELECTED_GUARD_WORKER = null;
        return;
    }

    SELECTED_GUARD_WORKER = trab;
    document.getElementById('prev-name').textContent = `${trab.nombre_completo} (${trab.codigo_credencial})`;
    document.getElementById('prev-state').textContent = trab.estado;
    document.getElementById('prev-state').className = trab.estado === 'ACTIVO' ? 'badge badge-success' : 'badge badge-danger';
    document.getElementById('prev-cargo').textContent = trab.cargo;
    document.getElementById('prev-depto').textContent = trab.departamento;
    document.getElementById('prev-location').textContent = trab.ubicacion_actual === 'DENTRO_PLANTA' ? 'DENTRO DE LA EMPRESA' : 'FUERA DE PLANTA';
    document.getElementById('prev-zones').textContent = `Puertas [${(trab.zonas_autorizadas || []).join(', ')}]`;

    // Alternar visibilidad de botones según estado actual
    document.getElementById('btn-guard-in').disabled = trab.ubicacion_actual === 'DENTRO_PLANTA';
    document.getElementById('btn-guard-out').disabled = trab.ubicacion_actual !== 'DENTRO_PLANTA';

    preview.classList.remove('hidden');
}

async function executeGuardAction(tipo) {
    if (!SELECTED_GUARD_WORKER) return;

    const puertaId = document.getElementById('guard-puerta-select').value;
    const feedback = document.getElementById('guard-feedback');

    try {
        const res = await fetch('/api/admin/porteria/registrar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identificador: SELECTED_GUARD_WORKER.id,
                tipo_movimiento: tipo,
                zona_id: Number(puertaId) || 1,
                observacion: `Marcación validada por el Vigilante en garita`
            })
        });

        const data = await res.json();

        if (res.ok) {
            showFeedback(feedback, data.mensaje, 'success');
            document.getElementById('guard-worker-preview').classList.add('hidden');
            document.getElementById('guard-worker-search').value = '';
            SELECTED_GUARD_WORKER = null;
            loadAdminDashboardData();
        } else {
            showFeedback(feedback, data.error || 'Operación bloqueada por el servidor.', 'error');
        }
    } catch {
        showFeedback(feedback, 'Error de conexión con el servidor.', 'error');
    }
}

// TAB 3: Historial de Asistencia y Reporte CSV
function renderAttendanceTable(registros) {
    const tbody = document.querySelector('#table-attendance-full tbody');
    if (!registros.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#64748b;">No hay registros de asistencia en la base de datos.</td></tr>`;
        return;
    }

    tbody.innerHTML = registros.map(r => `
        <tr>
            <td><strong>${r.codigo_movimiento}</strong></td>
            <td>${r.fecha}</td>
            <td>${r.trabajador_nombre} <small>(${r.codigo_credencial})</small></td>
            <td>${r.departamento}</td>
            <td>${r.zona_nombre.split('(')[0]}</td>
            <td><span style="color:#166534;font-weight:700;">${r.hora_entrada}</span></td>
            <td><span style="color:#991b1b;font-weight:700;">${r.hora_salida || '--'}</span></td>
            <td>${r.horas_formateadas}</td>
            <td>${r.estado_asistencia === 'PUNTUAL' ? '<span class="badge badge-success">PUNTUAL</span>' : '<span class="badge badge-warning">TARDANZA</span>'}</td>
            <td><small>${r.registrado_por_nombre}</small></td>
        </tr>
    `).join('');
}

function exportAttendanceCsv() {
    if (!DASHBOARD_DATA || !DASHBOARD_DATA.registros_acceso || !DASHBOARD_DATA.registros_acceso.length) {
        alert('No hay datos para exportar.');
        return;
    }

    const headers = ['Codigo', 'Fecha', 'Trabajador', 'Credencial', 'Documento', 'Departamento', 'Puerta', 'HoraEntrada', 'HoraSalida', 'HorasTrabajadas', 'Puntualidad', 'Vigilante'];
    const rows = DASHBOARD_DATA.registros_acceso.map(r => [
        r.codigo_movimiento,
        r.fecha,
        `"${r.trabajador_nombre}"`,
        r.codigo_credencial,
        r.documento,
        `"${r.departamento}"`,
        `"${r.zona_nombre}"`,
        r.hora_entrada,
        r.hora_salida || '',
        `"${r.horas_formateadas}"`,
        r.estado_asistencia,
        `"${r.registrado_por_nombre}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SentinelPro_Reporte_Asistencia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// TAB 4: Trabajadores (RR.HH.)
function renderWorkersCrudTable(trabajadores) {
    const tbody = document.querySelector('#table-workers-crud tbody');
    if (!trabajadores.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#64748b;">No hay trabajadores dados de alta.</td></tr>`;
        return;
    }

    tbody.innerHTML = trabajadores.map(t => {
        const isActivo = t.estado === 'ACTIVO';
        const toggleBtn = isActivo 
            ? `<button class="btn btn-warning btn-sm" onclick="toggleWorkerStatus(${t.id}, 'SUSPENDIDO')">⏸️ Suspender Acceso</button>`
            : `<button class="btn btn-success btn-sm" onclick="toggleWorkerStatus(${t.id}, 'ACTIVO')">▶️ Reactivar</button>`;

        return `
            <tr>
                <td><strong>${t.codigo_credencial}</strong></td>
                <td>${t.documento}</td>
                <td>${t.nombre_completo}</td>
                <td>${t.cargo} <br><small style="color:#64748b;">${t.departamento}</small></td>
                <td>Turno ${t.turno_id || 1}</td>
                <td>Puertas: [${(t.zonas_autorizadas || []).join(', ')}]</td>
                <td>${isActivo ? '<span class="badge badge-success">ACTIVO</span>' : '<span class="badge badge-danger">SUSPENDIDO</span>'}</td>
                <td>${toggleBtn}</td>
            </tr>
        `;
    }).join('');
}

async function toggleWorkerStatus(id, newStatus) {
    try {
        const res = await fetch(`/api/admin/trabajadores/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: newStatus })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            loadAdminDashboardData();
        } else {
            alert(data.error || 'Error al actualizar estado.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

// Modal Nuevo Trabajador
function openNewWorkerModal() {
    if (!DASHBOARD_DATA) return;
    const selTurno = document.getElementById('mw-turno');
    selTurno.innerHTML = (DASHBOARD_DATA.turnos_laborales || []).map(tn => `
        <option value="${tn.id}">${tn.nombre} (${tn.hora_entrada} - ${tn.hora_salida})</option>
    `).join('');

    const chkZonas = document.getElementById('mw-zones-checkboxes');
    chkZonas.innerHTML = (DASHBOARD_DATA.zonas_acceso || []).map(z => `
        <label class="checkbox-item">
            <input type="checkbox" name="mw_zone" value="${z.id}" checked>
            <span>${z.codigo} (${z.nombre.split('(')[0]})</span>
        </label>
    `).join('');

    document.getElementById('modal-new-worker').classList.remove('hidden');
}

function closeNewWorkerModal() {
    document.getElementById('modal-new-worker').classList.add('hidden');
}

async function saveNewWorker() {
    const name = document.getElementById('mw-name').value.trim();
    const doc = document.getElementById('mw-doc').value.trim();
    const code = document.getElementById('mw-code').value.trim();
    const cargo = document.getElementById('mw-cargo').value.trim();
    const depto = document.getElementById('mw-depto').value.trim();
    const turnoId = document.getElementById('mw-turno').value;
    const estado = document.getElementById('mw-estado').value;

    const selectedZones = Array.from(document.querySelectorAll('input[name="mw_zone"]:checked')).map(cb => Number(cb.value));

    if (!name || !doc) {
        alert('Nombre completo y documento son obligatorios.');
        return;
    }

    try {
        const res = await fetch('/api/admin/trabajadores', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre_completo: name,
                documento: doc,
                codigo_credencial: code || undefined,
                cargo,
                departamento: depto,
                turno_id: turnoId,
                zonas_autorizadas: selectedZones,
                estado
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            closeNewWorkerModal();
            loadAdminDashboardData();
        } else {
            alert(data.error || 'No se pudo crear el trabajador.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

// TAB 5: Visitantes
function renderVisitorsTable(visitantes) {
    const tbody = document.querySelector('#table-visitors tbody');
    if (!visitantes.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#64748b;">No hay visitas registradas hoy.</td></tr>`;
        return;
    }

    tbody.innerHTML = visitantes.map(v => {
        const isInside = v.estado === 'EN_PLANTA';
        const actionBtn = isInside 
            ? `<button class="btn btn-warning btn-sm" onclick="markVisitorExit(${v.id}, '${v.nombre_completo}')">🔴 Salida</button>`
            : `<span style="color:#64748b;font-size:0.8rem;">Finalizada</span>`;

        return `
            <tr>
                <td><strong>${v.gafete}</strong></td>
                <td>${v.nombre_completo} <br><small>${v.documento}</small></td>
                <td>${v.empresa_origen}</td>
                <td>${v.anfitrion_visitado}</td>
                <td>${v.hora_entrada}</td>
                <td>${v.hora_salida || '--'}</td>
                <td>${isInside ? '<span class="badge badge-info">EN PLANTA</span>' : '<span class="badge badge-neutral">SALIDA REGISTRADA</span>'}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

function openNewVisitorModal() {
    document.getElementById('modal-new-visitor').classList.remove('hidden');
}

function closeNewVisitorModal() {
    document.getElementById('modal-new-visitor').classList.add('hidden');
}

async function saveNewVisitor() {
    const name = document.getElementById('mvis-name').value.trim();
    const doc = document.getElementById('mvis-doc').value.trim();
    const empresa = document.getElementById('mvis-empresa').value.trim();
    const host = document.getElementById('mvis-host').value.trim();
    const gafete = document.getElementById('mvis-gafete').value.trim();
    const motivo = document.getElementById('mvis-motivo').value.trim();

    if (!name || !doc || !host) {
        alert('Nombre, documento y anfitrión son obligatorios.');
        return;
    }

    try {
        const res = await fetch('/api/admin/visitantes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre_completo: name,
                documento: doc,
                empresa_origen: empresa,
                anfitrion_visitado: host,
                gafete: gafete || undefined,
                motivo
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            closeNewVisitorModal();
            loadAdminDashboardData();
        } else {
            alert(data.error || 'Error al registrar visita.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

async function markVisitorExit(id, name) {
    if (!confirm(`¿Registrar la salida de ${name} y liberar su gafete?`)) return;

    try {
        const res = await fetch(`/api/admin/visitantes/${id}/salida`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            loadAdminDashboardData();
        } else {
            alert(data.error);
        }
    } catch {
        alert('Error de conexión.');
    }
}

// ============================================================================
// 10. MÓDULO SUPERVISIÓN DE PATIO Y CUADRILLAS EN VIVO (JEFE DE PATIO)
// ============================================================================
async function loadPatioCuadrilla() {
    if (!AUTH_TOKEN) return;
    try {
        const res = await fetch('/api/patio/cuadrilla-en-vivo', {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('Error cargando cuadrilla en vivo:', data.error);
            return;
        }

        // KPIs
        if (data.resumen) {
            document.getElementById('patio-kpi-total').textContent = data.resumen.total_patio;
            document.getElementById('patio-kpi-presentes').textContent = data.resumen.presentes_patio;
            document.getElementById('patio-kpi-ausentes').textContent = data.resumen.ausentes_patio;
            document.getElementById('patio-kpi-maquinaria').textContent = `${data.resumen.operadores_en_maquina}/${data.resumen.total_maquinaria_critica}`;

            // Banner de Alerta Maquinaria
            const alertBanner = document.getElementById('patio-machinery-alert');
            const alertText = document.getElementById('patio-machinery-alert-text');
            if (data.resumen.alerta_maquinaria_critica) {
                alertBanner.classList.remove('hidden');
                alertText.innerHTML = `<strong>⚠️ ALERTA 15 MIN:</strong> Faltan los siguientes operadores de maquinaria crítica para iniciar cargue y prensas: <strong>${data.resumen.maquinaria_faltante.join(', ')}</strong>.`;
            } else {
                alertBanner.classList.add('hidden');
            }
        }

        // Render Cuadrillas
        if (data.cuadrillas) {
            renderSquadCards('patio-grid-maquinaria', data.cuadrillas.maquinaria_critica || []);
            renderSquadCards('patio-grid-mecanico', data.cuadrillas.mantenimiento || []);
            renderSquadCards('patio-grid-cuadrilla', data.cuadrillas.cuadrilla_patio || []);
            renderSquadCards('patio-grid-admin', data.cuadrillas.administracion || []);
        }
    } catch (err) {
        console.error('Error de conexión con módulo de cuadrilla:', err);
    }
}

function renderSquadCards(containerId, workers) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (workers.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">No hay personal asignado a esta cuadrilla.</p>';
        return;
    }

    container.innerHTML = workers.map(w => {
        const enPlanta = w.ubicacion_actual === 'DENTRO_PLANTA';
        let statusClass = 'status-ausente';
        let statusBadge = '<span class="badge badge-danger">NO HA LLEGADO</span>';

        if (enPlanta) {
            if (w.estado_presencia?.includes('TARDANZA')) {
                statusClass = 'status-tardanza';
                statusBadge = `<span class="badge badge-warning">${w.estado_presencia}</span>`;
            } else {
                statusClass = 'status-presente';
                statusBadge = '<span class="badge badge-success">EN PLANTA</span>';
            }
        } else if (w.estado_presencia === 'SALIO') {
            statusBadge = '<span class="badge badge-neutral">TURNO FINALIZADO</span>';
        }

        const horaInfo = w.hora_entrada ? `Entrada: ${w.hora_entrada}` : 'Sin marcar hoy';
        const foto = w.foto_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';

        return `
            <div class="squad-worker-card ${statusClass}">
                <img src="${foto}" alt="${w.nombre_completo}" class="squad-photo">
                <div class="squad-info">
                    <div class="squad-name">
                        <span>${w.nombre_completo}</span>
                        ${statusBadge}
                    </div>
                    <div class="squad-role">${w.cargo}</div>
                    <div class="squad-meta">CC ${w.documento} • ${horaInfo}</div>
                </div>
            </div>
        `;
    }).join('');
}

function openAutorizarExtraModal() {
    const modal = document.getElementById('modal-autorizar-extra');
    if (!modal) return;

    const selTrab = document.getElementById('extra-trabajador-id');
    const inputFecha = document.getElementById('extra-fecha');
    if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

    if (selTrab && SYSTEM_DATA && SYSTEM_DATA.trabajadores_demo) {
        // Filtrar personal de patio
        selTrab.innerHTML = SYSTEM_DATA.trabajadores_demo
            .filter(t => !t.cargo?.includes('Contador') && !t.cargo?.includes('SENA'))
            .map(t => `<option value="${t.id}">${t.nombre_completo} (${t.cargo} — CC: ${t.documento})</option>`)
            .join('');
    }

    modal.classList.remove('hidden');
}

function closeAutorizarExtraModal() {
    const modal = document.getElementById('modal-autorizar-extra');
    if (modal) modal.classList.add('hidden');
}

async function submitAutorizarExtra() {
    const trabajador_id = document.getElementById('extra-trabajador-id').value;
    const fecha_programada = document.getElementById('extra-fecha').value;
    const dia = document.getElementById('extra-dia').value;
    const horas_estimadas = document.getElementById('extra-horas').value;
    const motivo = document.getElementById('extra-motivo').value.trim();

    if (!motivo) {
        alert('Por favor ingresa la justificación operativa de la jornada extraordinaria.');
        return;
    }

    try {
        const res = await fetch('/api/patio/autorizar-extra', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                trabajador_id: Number(trabajador_id),
                fecha_programada,
                dia,
                horas_estimadas: Number(horas_estimadas),
                motivo
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.mensaje);
            closeAutorizarExtraModal();
            loadPatioCuadrilla();
        } else {
            alert(data.error || 'No se pudo autorizar la jornada extraordinaria.');
        }
    } catch {
        alert('Error de conexión al autorizar jornada extraordinaria.');
    }
}

// ============================================================================
// 11. MÓDULO NÓMINA Y HORAS 42H (CST / LEY 2101)
// ============================================================================
async function loadNominaReport() {
    if (!AUTH_TOKEN) return;
    try {
        const res = await fetch('/api/nomina/reporte-42h', {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('Error cargando reporte de nómina:', data.error);
            return;
        }

        if (data.resumen_semanal) {
            document.getElementById('nom-kpi-trabajadores').textContent = data.resumen_semanal.total_trabajadores;
            document.getElementById('nom-kpi-horas').textContent = `${data.resumen_semanal.total_horas_empresa}h`;
            document.getElementById('nom-kpi-hed').textContent = `${data.resumen_semanal.total_hed}h`;
            document.getElementById('nom-kpi-rdf').textContent = `${data.resumen_semanal.total_rdf}h`;
        }

        const tbody = document.getElementById('nomina-table-body');
        if (tbody && Array.isArray(data.reporte)) {
            tbody.innerHTML = data.reporte.map(item => `
                <tr>
                    <td><strong>${item.documento}</strong></td>
                    <td>
                        <div style="font-weight:600;color:#0f172a;">${item.nombre_completo}</div>
                        <div style="font-size:0.75rem;color:#64748b;">${item.codigo_credencial}</div>
                    </td>
                    <td>
                        <div>${item.cargo}</div>
                        <small style="color:#64748b;">${item.departamento}</small>
                    </td>
                    <td>
                        <span class="badge ${item.tipo_personal === 'PATIO' ? 'badge-warning' : (item.tipo_personal === 'APRENDIZ_SENA' ? 'badge-info' : 'badge-neutral')}">
                            ${item.tipo_personal}
                        </span>
                    </td>
                    <td style="text-align:center;font-weight:700;color:#0f172a;">${item.horas_ordinarias}h</td>
                    <td style="text-align:center;">
                        ${item.horas_extras_diurnas_hed > 0 ? `<span class="badge-overtime">+${item.horas_extras_diurnas_hed}h</span>` : '0.0h'}
                    </td>
                    <td style="text-align:center;">
                        ${item.horas_extras_nocturnas_hen > 0 ? `<span class="badge-overtime">+${item.horas_extras_nocturnas_hen}h</span>` : '0.0h'}
                    </td>
                    <td style="text-align:center;">
                        ${item.recargo_nocturno_rn > 0 ? `<span class="badge badge-info">+${item.recargo_nocturno_rn}h</span>` : '0.0h'}
                    </td>
                    <td style="text-align:center;">
                        ${item.horas_dominicales_festivas_rdf > 0 ? `<span class="badge badge-danger">+${item.horas_dominicales_festivas_rdf}h</span>` : '0.0h'}
                    </td>
                    <td style="text-align:center;font-weight:700;color:#ea580c;font-size:1.05rem;">
                        ${item.total_horas_liquidadas}h
                    </td>
                    <td style="text-align:center;">
                        <span class="badge ${item.cumplimiento_42h === 'CUMPLIDO' ? 'badge-success' : 'badge-neutral'}">
                            ${item.cumplimiento_42h}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Error de conexión con nómina:', err);
    }
}

function exportNominaCsv() {
    if (!AUTH_TOKEN) return;
    window.open('/api/nomina/reporte-42h?format=csv', '_blank');
}

// ============================================================================
// 12. MÓDULO DE IDENTIDAD Y CONTROL DE ACCESO (IAM: USUARIOS, ROLES Y PERMISOS)
// ============================================================================
let IAM_DATA = null;

async function loadIamModuleData() {
    if (!AUTH_TOKEN) return;
    try {
        const res = await fetch('/api/admin/seguridad/estado', {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('Error cargando módulo IAM:', data.error);
            return;
        }

        IAM_DATA = data;
        renderIamUsersTable(data.usuarios || [], data.roles_sistema || {});
        populateIamUserPicker(data.usuarios || []);
        loadUserPermissionMatrix();
        renderIamSessionsTable(data.sesiones_activas || []);
        renderIamAuditLogs(data.audit_logs || []);
    } catch (err) {
        console.error('Error de conexión con módulo IAM:', err);
    }
}

function renderIamUsersTable(usuarios, roles) {
    const tbody = document.getElementById('table-iam-users-body');
    if (!tbody) return;

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No hay usuarios registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        const roleInfo = roles[u.rol] || { nombre: u.rol, color: '#64748b' };
        const statusBadge = u.activo
            ? '<span class="badge badge-success">ACTIVO</span>'
            : '<span class="badge badge-danger">INACTIVO</span>';
        
        const sessionsInfo = `${u.max_sesiones_simultaneas} máx (${u.politica_concurrencia === 'RECHAZAR_NUEVA' ? 'Estricta' : 'Cierra prev'})`;

        return `
            <tr>
                <td>
                    <div style="font-weight:600;color:#0f172a;">${u.nombre_completo}</div>
                    <small style="color:#64748b;">ID #${u.id}</small>
                </td>
                <td><code>${u.email}</code></td>
                <td>
                    <span class="badge" style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;font-weight:600;">
                        ${roleInfo.nombre || u.rol}
                    </span>
                </td>
                <td>${u.cargo || 'Funcionario'}</td>
                <td style="text-align:center;font-size:0.8rem;color:#475569;">${sessionsInfo}</td>
                <td style="text-align:center;">${statusBadge}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex;gap:4px;">
                        <button class="btn btn-secondary btn-sm" onclick="editIamUser(${u.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="selectUserForMatrix(${u.id})">
                            🎛️ Permisos
                        </button>
                        <button class="btn ${u.activo ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleIamUserActive(${u.id}, ${!u.activo})">
                            ${u.activo ? 'Bloquear' : 'Activar'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function populateIamUserPicker(usuarios) {
    const sel = document.getElementById('iam-user-picker');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = usuarios.map(u => `<option value="${u.id}">${u.nombre_completo} (${u.email} — ${u.rol})</option>`).join('');
    if (currentVal && usuarios.some(u => String(u.id) === String(currentVal))) {
        sel.value = currentVal;
    }
}

function selectUserForMatrix(userId) {
    const sel = document.getElementById('iam-user-picker');
    if (sel) {
        sel.value = userId;
        loadUserPermissionMatrix();
        sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function openNewIamUserModal() {
    const modal = document.getElementById('modal-iam-user');
    if (!modal) return;
    document.getElementById('modal-iam-user-title').textContent = '➕ Nuevo Usuario del Sistema';
    document.getElementById('iam-u-id').value = '';
    document.getElementById('iam-u-name').value = '';
    document.getElementById('iam-u-email').value = '';
    document.getElementById('iam-u-email').disabled = false;
    document.getElementById('iam-u-pass').value = '';
    document.getElementById('iam-u-pass-hint').textContent = '(Obligatorio para usuario nuevo)';
    document.getElementById('iam-u-role').value = 'VIGILANTE_PORTERIA';
    document.getElementById('iam-u-cargo').value = 'Oficial de Seguridad en Garita';
    document.getElementById('iam-u-sessions').value = '1';
    document.getElementById('iam-u-policy').value = 'CERRAR_ANTERIOR';
    document.getElementById('iam-u-status').value = 'true';
    modal.classList.remove('hidden');
}

function editIamUser(userId) {
    if (!IAM_DATA || !IAM_DATA.usuarios) return;
    const user = IAM_DATA.usuarios.find(u => Number(u.id) === Number(userId));
    if (!user) return;

    const modal = document.getElementById('modal-iam-user');
    if (!modal) return;

    document.getElementById('modal-iam-user-title').textContent = `✏️ Editar Usuario: ${user.nombre_completo}`;
    document.getElementById('iam-u-id').value = user.id;
    document.getElementById('iam-u-name').value = user.nombre_completo;
    document.getElementById('iam-u-email').value = user.email;
    document.getElementById('iam-u-email').disabled = true;
    document.getElementById('iam-u-pass').value = '';
    document.getElementById('iam-u-pass-hint').textContent = '(Dejar en blanco para mantener la clave actual)';
    document.getElementById('iam-u-role').value = user.rol;
    document.getElementById('iam-u-cargo').value = user.cargo || '';
    document.getElementById('iam-u-sessions').value = user.max_sesiones_simultaneas || 1;
    document.getElementById('iam-u-policy').value = user.politica_concurrencia || 'CERRAR_ANTERIOR';
    document.getElementById('iam-u-status').value = String(user.activo);

    modal.classList.remove('hidden');
}

function closeIamUserModal() {
    const modal = document.getElementById('modal-iam-user');
    if (modal) modal.classList.add('hidden');
}

async function saveIamUser() {
    const id = document.getElementById('iam-u-id').value;
    const nombre_completo = document.getElementById('iam-u-name').value.trim();
    const email = document.getElementById('iam-u-email').value.trim();
    const password = document.getElementById('iam-u-pass').value.trim();
    const rol = document.getElementById('iam-u-role').value;
    const cargo = document.getElementById('iam-u-cargo').value.trim();
    const max_sesiones_simultaneas = Number(document.getElementById('iam-u-sessions').value) || 1;
    const politica_concurrencia = document.getElementById('iam-u-policy').value;
    const activo = document.getElementById('iam-u-status').value === 'true';

    if (!nombre_completo || !email) {
        alert('Nombre completo y correo electrónico son obligatorios.');
        return;
    }

    if (!id && !password) {
        alert('La contraseña inicial es obligatoria para nuevos usuarios.');
        return;
    }

    try {
        let res, data;
        if (!id) {
            res = await fetch('/api/admin/seguridad/usuarios', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre_completo,
                    email,
                    password,
                    rol,
                    cargo,
                    max_sesiones_simultaneas,
                    politica_concurrencia,
                    activo
                })
            });
        } else {
            const payload = {
                nombre_completo,
                rol,
                cargo,
                max_sesiones_simultaneas,
                politica_concurrencia,
                activo
            };
            if (password) payload.password = password;

            res = await fetch(`/api/admin/seguridad/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }

        data = await res.json();
        if (res.ok) {
            alert(data.mensaje || 'Usuario guardado correctamente.');
            closeIamUserModal();
            loadIamModuleData();
        } else {
            alert(data.error || 'Error al procesar el usuario.');
        }
    } catch {
        alert('Error de conexión con el servidor de seguridad.');
    }
}

async function toggleIamUserActive(userId, newActive) {
    const accion = newActive ? 'activar' : 'bloquear el acceso de';
    if (!confirm(`¿Estás seguro de que deseas ${accion} este usuario?`)) return;

    try {
        const res = await fetch(`/api/admin/seguridad/usuarios/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: newActive })
        });
        const data = await res.json();
        if (res.ok) {
            loadIamModuleData();
        } else {
            alert(data.error || 'No se pudo cambiar el estado del usuario.');
        }
    } catch {
        alert('Error de conexión con el servidor.');
    }
}

function loadUserPermissionMatrix() {
    if (!IAM_DATA) return;
    const sel = document.getElementById('iam-user-picker');
    if (!sel || !sel.value) return;

    const userId = Number(sel.value);
    const user = (IAM_DATA.usuarios || []).find(u => Number(u.id) === userId);
    if (!user) return;

    const banner = document.getElementById('matrix-user-banner');
    const roleInfo = IAM_DATA.roles_sistema[user.rol] || { nombre: user.rol, permisos: [] };
    const overrides = user.permisos_individuales || {};

    if (banner) {
        banner.innerHTML = `
            <div>
                <strong>${user.nombre_completo}</strong> (${user.email}) — 
                <span class="badge" style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;">${roleInfo.nombre}</span>
                <span style="color:#64748b;margin-left:8px;">Cargo: ${user.cargo || 'N/A'}</span>
            </div>
            <div>
                <small style="color:#64748b;">${Object.keys(overrides).length} overrides individuales activos</small>
            </div>
        `;
    }

    const tbody = document.querySelector('#table-perm-matrix tbody');
    if (!tbody || !IAM_DATA.catalogo_permisos) return;

    const perms = Object.entries(IAM_DATA.catalogo_permisos);

    tbody.innerHTML = perms.map(([code, p]) => {
        const roleHas = (roleInfo.permisos || []).includes(code);
        const override = overrides[code];
        const effective = override === 'ALLOW' ? true : (override === 'DENY' ? false : roleHas);

        const inheritedBadge = roleHas
            ? '<span class="badge badge-success">HEREDA ALLOW</span>'
            : '<span class="badge badge-neutral">HEREDA DENY</span>';

        let overrideBadge = '<span class="badge badge-neutral">SIN OVERRIDE</span>';
        if (override === 'ALLOW') overrideBadge = '<span class="badge badge-success">ALLOW FORZADO</span>';
        if (override === 'DENY') overrideBadge = '<span class="badge badge-danger">DENY FORZADO</span>';

        const effectiveBadge = effective
            ? '<span class="badge badge-success" style="font-weight:700;">🟢 PERMITIDO</span>'
            : '<span class="badge badge-danger" style="font-weight:700;">🔴 DENEGADO</span>';

        return `
            <tr>
                <td><code>${code}</code></td>
                <td><span class="badge badge-neutral">${p.modulo}</span></td>
                <td>${p.descripcion}</td>
                <td>${inheritedBadge}</td>
                <td>${overrideBadge}</td>
                <td>${effectiveBadge}</td>
                <td>
                    <div style="display:inline-flex;gap:4px;">
                        <button class="btn btn-success btn-sm" onclick="setUserOverridePermission(${user.id}, '${code}', 'ALLOW')" title="Forzar ALLOW">
                            ✅ Permitir
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="setUserOverridePermission(${user.id}, '${code}', 'DENY')" title="Forzar DENY">
                            🚫 Denegar
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="setUserOverridePermission(${user.id}, '${code}', null)" title="Restablecer a herencia">
                            🔄 Heredar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function setUserOverridePermission(userId, permCode, overrideVal) {
    try {
        const payload = {
            permisos_individuales: {
                [permCode]: overrideVal
            }
        };

        const res = await fetch(`/api/admin/seguridad/usuarios/${userId}/permisos`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            if (IAM_DATA && IAM_DATA.usuarios) {
                const u = IAM_DATA.usuarios.find(x => Number(x.id) === Number(userId));
                if (u) {
                    if (!u.permisos_individuales) u.permisos_individuales = {};
                    if (overrideVal === null) {
                        delete u.permisos_individuales[permCode];
                    } else {
                        u.permisos_individuales[permCode] = overrideVal;
                    }
                }
            }
            loadUserPermissionMatrix();
        } else {
            alert(data.error || 'No se pudo actualizar el permiso.');
        }
    } catch {
        alert('Error de conexión al actualizar permisos.');
    }
}

function renderIamSessionsTable(sesiones) {
    const tbody = document.querySelector('#table-iam-sessions tbody');
    if (!tbody) return;

    if (sesiones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">No hay sesiones activas en este momento.</td></tr>';
        return;
    }

    tbody.innerHTML = sesiones.map(s => `
        <tr>
            <td>
                <strong>${s.usuario_email}</strong>
                <div style="font-size:0.75rem;color:#64748b;">${s.dispositivo || 'Navegador Web'}</div>
            </td>
            <td><span class="badge badge-neutral">${s.usuario_rol}</span></td>
            <td><code>${s.ip}</code></td>
            <td><small>${s.inicio_sesion ? s.inicio_sesion.split('T')[1]?.slice(0, 5) : '--'}</small></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="terminateIamSession('${s.token}')">
                    Cerrar
                </button>
            </td>
        </tr>
    `).join('');
}

async function terminateIamSession(token) {
    if (!confirm('¿Deseas revocar inmediatamente esta sesión activa?')) return;
    try {
        const res = await fetch(`/api/admin/seguridad/sesiones/${token}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        if (res.ok) {
            loadIamModuleData();
        } else {
            alert('No se pudo revocar la sesión.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

function renderIamAuditLogs(logs) {
    const tbody = document.querySelector('#table-iam-logs tbody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">No hay registros de auditoría aún.</td></tr>';
        return;
    }

    tbody.innerHTML = logs.slice(0, 30).map(l => {
        const hora = l.timestamp ? l.timestamp.replace('T', ' ').slice(0, 19) : '--';
        const resBadge = l.resultado === 'EXITO'
            ? '<span class="badge badge-success">EXITO</span>'
            : '<span class="badge badge-danger">DENEGADO</span>';

        return `
            <tr>
                <td><small style="color:#64748b;">${hora}</small></td>
                <td><strong>${l.evento}</strong></td>
                <td><small>${l.usuario_email || 'anónimo'}</small></td>
                <td>${resBadge}</td>
                <td><small style="color:#475569;">${l.detalle || ''}</small></td>
            </tr>
        `;
    }).join('');
}
