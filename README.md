# ♻️ RNR S.A.S. — Sistema Integral de Control de Acceso y Asistencia 42h
## Recuperaciones Naranjo Recycling S.A.S. — Sede Industrial Cartagena de Indias (Bolívar, Colombia)

> **Aplicación React + TypeScript + Vite + Tailwind CSS**  
> **Régimen Laboral Oficial:** 42 Horas Semanales (Lunes a Viernes) según Ley 2101 / CST de Colombia.  
> **Sede:** Zona Industrial Mamonal Km 7, Cartagena de Indias.

---

## 🚀 Inicio y Desarrollo

Para ejecutar el servidor de desarrollo en el entorno:
```bash
npm run dev
```
La aplicación inicia en `http://0.0.0.0:3000`.

Para compilar para producción:
```bash
npm run build
```

Para verificar tipos con TypeScript:
```bash
npm run lint
```

---

## 🌟 Características Principales Portadas a React

1. **Terminal Kiosco Táctil Peatonal:**
   - Teclado táctil ergonómico en pantalla (0-9, Clear, Backspace, Confirmar).
   - Verificación instantánea de Cédula de Ciudadanía y control anti-passback.
   - Panel de confirmación dinámica con fotos de colaboradores, validaciones de seguridad (Estado, Cobertura ARL, Jornada 42h) y audio sintético con Web Audio API (chime de éxito y buzzer de rechazo).
   - Feed de movimientos en vivo con filtros rápidos (Todos, Entradas, Salidas).
   - Modal de consulta rápida de credenciales.

2. **Consola de Supervisión y Panel de Administración:**
   - **Dashboard & Aforo:** Monitoreo en tiempo real de capacidad física (150 personas máx.), aforo porcentual y personal actualmente dentro de planta con botón de salida rápida.
   - **Mi Cuadrilla en Vivo (Patio):** Monitoreo directo de operadores de maquinaria pesada (Grúas Pulpo #1 y #2, Montacargas, Mecánico de Planta, Oxigenistas) y módulo de autorización de horas extras en fines de semana.
   - **Nómina y Horas 42h (CST):** Consolidación semanal con distribución legal colombiana (Lunes 7h, Mar-Jue 8.5–9h, Vie 8.5h), horas ordinarias, recargos y exportación a CSV.
   - **Consola de Portería:** Registro manual o por RFID para el oficial de garita con selección de puerta física y observaciones.
   - **Historial Completo de Asistencia:** Auditoría de movimientos con filtros de fecha, estado de puntualidad y descarga CSV.
   - **Padrón de Trabajadores:** CRUD completo de empleados, puestos críticos, alternador rápido de ARL y estado laboral (Activo / Suspendido / Vacaciones / Retirado).
   - **Control de Visitantes y Camiones de Chatarra:** Pesaje en báscula, asignación de gafete y registro vehicular.
   - **Puertas y Zonas:** Parametrización física de la planta Mamonal y matriz oficial de turnos 42h.
   - **Alertas de Acceso:** Detección de bloqueos por ARL vencida o personal suspendido con opción de resolución.
   - **Control de Acceso (IAM):** Gestión de roles, revocación de sesiones concurrentes y registro forense de auditoría.
   - **Configuración Empresa:** Parámetros corporativos, tolerancia de tardanzas (10 min) y aforo.

---

## 👥 Credenciales de Acceso por Perfil

| Rol Oficial | Correo Electrónico | Contraseña | Responsabilidad Principal |
| :--- | :--- | :---: | :--- |
| **Director General** (Super Admin) | `admin@recuperacionesnaranjo.com` | `admin123` | Control total, configuración y auditoría |
| **Vigilante Garita & Báscula** | `vigilante@recuperacionesnaranjo.com` | `vigi123` | Garita peatonal, EPP y camiones de chatarra |
| **Jefe de Patio y Cuadrillas** | `jefepatio@recuperacionesnaranjo.com` | `patio123` | Monitoreo en vivo de cuadrillas y maquinaria pesada |
| **Contabilidad & RRHH** | `contabilidad@recuperacionesnaranjo.com` | `conta123` | Pre-liquidación de nómina 42h y exportación CSV |

---

## 🕒 Horario Laboral Oficial (42 Horas Semanales — Ley 2101)

| Día | Hora Entrada | Inicio Almuerzo | Fin Almuerzo | Hora Salida | Horas Ordinarias | Aplica Patio | Aplica Administración |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lunes** | 8:00 AM | 12:00 PM | 1:30 PM (90m) | 4:30 PM | **7.0 h** | ✅ Sí | ✅ Sí |
| **Martes** | 7:30 AM | 12:00 PM | 1:00 PM (60m) | 5:00 PM | **8.5 h** | ✅ Sí | ✅ Sí |
| **Miércoles** | 7:30 AM | 12:00 PM | 1:00 PM (60m) | 5:30 PM | **9.0 h** | ✅ Sí | ✅ Sí |
| **Jueves** | 7:30 AM | 12:00 PM | 1:00 PM (60m) | 5:30 PM | **9.0 h** | ✅ Sí | ✅ Sí |
| **Viernes** | 7:30 AM | 12:00 PM | 1:00 PM (60m) | 5:00 PM | **8.5 h** | ✅ Sí | ✅ Sí |
| **Sábado** | 7:30 AM | — | — | 1:00 PM | **Extra (HED)** | ⚠️ Con Autorización | ❌ Descanso Remunerado |
| **Domingo / Festivo** | 7:30 AM | — | — | 1:00 PM | **Extra (RDF)** | ⚠️ Con Autorización | ❌ Descanso Remunerado |
| **TOTAL ORDINARIO** | — | — | — | — | **42.0 h** | — | — |
