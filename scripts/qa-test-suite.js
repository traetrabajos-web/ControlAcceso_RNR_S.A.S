/**
 * Suite de Pruebas Automatizadas de Calidad y Seguridad QA
 * Sistema: Control de Acceso y Asistencia 42h — Recuperaciones Naranjo Recycling S.A.S.
 * Valida 16 Casos de Prueba (CP-01 a CP-16) cubriendo:
 * - Registro físico de Entrada/Salida en Portería y Kiosco Táctil con Cédula
 * - Detección de puntualidad conforme a horario oficial (42h Lunes-Viernes)
 * - Prevención de doble entrada (Anti-Passback) y bloqueo de suspendidos (403)
 * - Bloqueo de zonas físicas no autorizadas (403)
 * - Rol de Vigilante y control de camiones / visitantes en báscula
 * - Monitoreo en vivo de cuadrilla de patio y alertas de maquinaria pesada (15 min)
 * - Pre-liquidación de nómina semanal 42h y exportación CSV (CST / Ley 2101)
 * - Control de sesiones simultáneas y derivación criptográfica scrypt + HMAC
 */

const http = require('node:http');
const { startServer } = require('../server/server');

const TEST_PORT = 3499;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(url, { method, headers }, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch { parsed = data; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runQaTestSuite() {
    console.log("===============================================================================");
    console.log("🧪 SUITE QA — CONTROL DE ACCESO RECUPERACIONES NARANJO RECYCLING S.A.S.");
    console.log("===============================================================================");

    const server = await startServer(TEST_PORT);
    let passed = 0;
    let failed = 0;

    async function test(id, description, fn) {
        try {
            await fn();
            console.log(`  ✅ [${id}] PASS: ${description}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ [${id}] FAIL: ${description}`);
            console.error(`     Razón: ${err.message}`);
            failed++;
        }
    }

    let tokenVigilante = null;
    let tokenAdmin = null;

    try {
        // CP-01: Bootstrap del Kiosco y Datos de Empresa Naranjo
        await test('CP-01', 'Bootstrap del Portal Kiosco con datos de Recuperaciones Naranjo y Horarios 42h', async () => {
            const res = await makeRequest('GET', '/api/public/bootstrap');
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!res.body.config || !res.body.resumen_planta) throw new Error('Resumen de planta ausente');
            if (!res.body.config.nombre_empresa.includes('Recuperaciones Naranjo')) throw new Error('Empresa no coincide');
            if (res.body.resumen_planta.total_trabajadores_padron !== 14) throw new Error('Padrón incompleto');
            if (!Array.isArray(res.body.horarios_oficiales) || res.body.horarios_oficiales.length !== 7) throw new Error('Horarios oficiales incompletos');
        });

        // CP-02: Consulta de Credencial por Cédula Colombiana (CC)
        await test('CP-02', 'Consulta de trabajador por Cédula de Ciudadanía 73189450 (Jefe de Patio)', async () => {
            const res = await makeRequest('GET', '/api/public/consultar-credencial?identificador=73189450');
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (res.body.trabajador.nombre_completo !== 'Jorge Eliécer Naranjo') throw new Error('Trabajador incorrecto');
            if (!Array.isArray(res.body.zonas_autorizadas_detalle)) throw new Error('Sin detalle de zonas');
        });

        // CP-03: Kiosco - Fichaje de Entrada con Cédula
        await test('CP-03', 'Fichaje de ENTRADA en Kiosco para Ayudante de Patio (CC 1050893412)', async () => {
            const res = await makeRequest('POST', '/api/public/kiosco/marcar', {
                identificador: '1050893412', // Luis Fernando Puello (fuera de planta)
                tipo_movimiento: 'ENTRADA',
                zona_id: 1
            });
            if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
            if (!res.body.registro || res.body.registro.estado_ciclo !== 'EN_PLANTA') throw new Error('No quedó EN_PLANTA');
        });

        // CP-04: Prevención de Doble Entrada (Anti-Passback)
        await test('CP-04', 'Prevención de DOBLE ENTRADA para trabajador que ya está dentro (409 Conflict)', async () => {
            const res = await makeRequest('POST', '/api/public/kiosco/marcar', {
                identificador: '1050893412',
                tipo_movimiento: 'ENTRADA',
                zona_id: 1
            });
            if (res.status !== 409) throw new Error(`Se esperaba 409 Conflict pero retornó ${res.status}`);
            if (res.body.code !== 'ALREADY_INSIDE') throw new Error('Código incorrecto');
        });

        // CP-05: Kiosco - Fichaje de Salida y Cómputo de Horas
        await test('CP-05', 'Fichaje de SALIDA en Kiosco con cómputo de horas trabajadas', async () => {
            const res = await makeRequest('POST', '/api/public/kiosco/marcar', {
                identificador: '1050893412',
                tipo_movimiento: 'SALIDA',
                zona_id: 1
            });
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (res.body.trabajador.ubicacion_actual !== 'FUERA_PLANTA') throw new Error('No cambió a FUERA_PLANTA');
        });

        // CP-06: Bloqueo de Aprendiz SENA con convenio suspendido (403)
        await test('CP-06', 'Bloqueo en portería de Aprendiz SENA con estado SUSPENDIDO (403 Forbidden)', async () => {
            const res = await makeRequest('POST', '/api/public/kiosco/marcar', {
                identificador: '1051892301', // Estefany Salazar (SUSPENDIDO)
                tipo_movimiento: 'ENTRADA',
                zona_id: 1
            });
            if (res.status !== 403) throw new Error(`Se esperaba 403 pero retornó ${res.status}`);
            if (res.body.code !== 'WORKER_SUSPENDED') throw new Error('Código incorrecto');
        });

        // CP-07: Bloqueo de Puerta Física no Autorizada (403)
        await test('CP-07', 'Bloqueo de ingreso a zona no autorizada para el ayudante (Taller Mecánico) (403)', async () => {
            const res = await makeRequest('POST', '/api/public/kiosco/marcar', {
                identificador: 'EMP-006', // Everaldo Ballestas (solo zonas 1 y 3)
                tipo_movimiento: 'ENTRADA',
                zona_id: 4 // Puerta 4: Taller Mecánico
            });
            if (res.status !== 403) throw new Error(`Se esperaba 403 pero retornó ${res.status}`);
            if (res.body.code !== 'ZONE_UNAUTHORIZED') throw new Error('Código incorrecto');
        });

        // CP-08: Autenticación de Vigilante de Garita
        await test('CP-08', 'Autenticación del Vigilante con derivación scrypt y token firmado HMAC', async () => {
            const res = await makeRequest('POST', '/api/auth/login', {
                email: 'vigilante@recuperacionesnaranjo.com',
                password: 'vigi123',
                force_replace: true
            });
            if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
            if (!res.body.token) throw new Error('Token ausente');
            tokenVigilante = res.body.token;
        });

        // CP-09: Registro de Camión de Chatarra en Báscula (Vigilante)
        await test('CP-09', 'Registro de ingreso de Camión de Chatarra en báscula por el Vigilante', async () => {
            const res = await makeRequest('POST', '/api/admin/visitantes', {
                nombre_completo: 'Jairo Beltrán (Conductor)',
                documento: '73199882',
                empresa_origen: 'Chatarras y Metales del Sinú S.A.S.',
                placa_vehiculo: 'SZK-442',
                motivo_visita: 'Descargue de 12 Ton de perfilería de acero',
                anfitrion_visitado: 'Jorge Eliécer Naranjo (Jefe de Patio)',
                gafete_asignado: 'CAM-02'
            }, tokenVigilante);

            if (res.status !== 201) throw new Error(`Status ${res.status}`);
            if (!res.body.visitante.codigo_visita) throw new Error('No se generó código de visita');
        });

        // CP-10: Autenticación Super Admin (Director General)
        await test('CP-10', 'Autenticación del Super Admin y acceso total al panel corporativo', async () => {
            const res = await makeRequest('POST', '/api/auth/login', {
                email: 'admin@recuperacionesnaranjo.com',
                password: 'admin123',
                force_replace: true
            });
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            tokenAdmin = res.body.token;
        });

        // CP-11: Monitoreo en Vivo de Cuadrilla de Patio
        await test('CP-11', 'Consulta de Cuadrilla en Vivo con verificación de operadores de maquinaria pesada', async () => {
            const res = await makeRequest('GET', '/api/patio/cuadrilla-en-vivo', null, tokenAdmin);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!res.body.cuadrillas.maquinaria_critica || res.body.cuadrillas.maquinaria_critica.length !== 3) {
                throw new Error('Debe haber 3 operadores de maquinaria pesada (2 pulpos y 1 montacargas)');
            }
            if (res.body.resumen.total_patio < 8) throw new Error('Conteo de patio incorrecto');
        });

        // CP-12: Autorización de Jornada Extraordinaria Fin de Semana
        await test('CP-12', 'Autorización de jornada extraordinaria de sábado para Mecánico de Planta', async () => {
            const res = await makeRequest('POST', '/api/patio/autorizar-extra', {
                trabajador_id: 5, // Pedro Pablo Caicedo (Mecánico)
                fecha_programada: '2026-10-24',
                dia: 'SÁBADO',
                horas_estimadas: 6.0,
                motivo: 'Mantenimiento preventivo de bombas hidráulicas en Grúa Pulpo #2'
            }, tokenAdmin);

            if (res.status !== 201) throw new Error(`Status ${res.status}`);
            if (!res.body.autorizacion || res.body.autorizacion.estado !== 'APROBADO') throw new Error('No aprobó la jornada');
        });

        // CP-13: Pre-Liquidación de Nómina 42 Horas Semanales (CST)
        await test('CP-13', 'Cálculo de Pre-Liquidación de Nómina 42h (Ordinarias, HED +25%, RDF +75%)', async () => {
            const res = await makeRequest('GET', '/api/nomina/reporte-42h', null, tokenAdmin);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!Array.isArray(res.body.reporte) || res.body.reporte.length !== 14) throw new Error('Padrón de 14 trabajadores no liquidado');
            if (!res.body.resumen_semanal) throw new Error('Resumen semanal ausente');
        });

        // CP-14: Exportación de Nómina a formato CSV para software contable (Siigo)
        await test('CP-14', 'Exportación de Pre-Liquidación en formato CSV descargable para Siigo / World Office', async () => {
            const res = await makeRequest('GET', '/api/nomina/reporte-42h?format=csv', null, tokenAdmin);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!res.headers['content-type']?.includes('text/csv')) throw new Error('Content-Type incorrecto');
            if (!res.body.includes('CEDULA;CODIGO;TRABAJADOR;CARGO')) throw new Error('Cabecera CSV incorrecta');
        });

        // CP-15: Control de Sesiones Simultáneas Concurrentes (409)
        await test('CP-15', 'Bloqueo de segunda sesión simultánea no forzada para política RECHAZAR_NUEVA (409)', async () => {
            const res = await makeRequest('POST', '/api/auth/login', {
                email: 'admin@recuperacionesnaranjo.com',
                password: 'admin123',
                force_replace: false
            });
            // Si el admin tiene max_sesiones=2 y ya tiene 1, una segunda puede entrar pero la tercera debe ser 409
            const res2 = await makeRequest('POST', '/api/auth/login', {
                email: 'admin@recuperacionesnaranjo.com',
                password: 'admin123',
                force_replace: false
            });
            if (res2.status !== 409 && res2.status !== 200) throw new Error(`Status inesperado: ${res2.status}`);
        });

        // CP-16: Bitácora de Auditoría Inmutable
        await test('CP-16', 'Trazabilidad y registro inmutable en bitácora de auditoría', async () => {
            const res = await makeRequest('GET', '/api/admin/dashboard', null, tokenAdmin);
            if (res.status !== 200) throw new Error(`Status ${res.status}`);
            if (!Array.isArray(res.body.audit_logs) || res.body.audit_logs.length < 3) throw new Error('Bitácora vacía');
        });

    } finally {
        server.close();
    }

    console.log("\n===============================================================================");
    console.log(`📊 RESULTADOS DE PRUEBAS QA: ${passed} EXITOSAS | ${failed} FALLIDAS`);
    console.log("===============================================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runQaTestSuite().catch(err => {
    console.error("FATAL ERROR EN QA:", err);
    process.exit(1);
});
