# ♻️ Sistema Integral de Control de Acceso, Asistencia 42h y Cuadrillas
## Empresa: Recuperaciones Naranjo Recycling S.A.S. — Sede Industrial Cartagena de Indias (Bolívar, Colombia)

> **Sistema Especializado y Parametrizado al 100%**  
> **Régimen Laboral Oficial:** 42 Horas Semanales (Lunes a Viernes) según Memorando Corporativo y Ley 2101 / CST de Colombia.  
> **Documento Maestro:** [`Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx`](./Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx)  
> **Diagramas de Arquitectura:** [`docs/diagramas_naranjo_png/`](./docs/diagramas_naranjo_png/) (8 diagramas de alta resolución a 2000x1250 px).

---

## 🚀 Inicio Rápido

Para iniciar el sistema en su máquina local:
1. Haz doble clic en el archivo **`iniciar-sistema.bat`** o ejecuta en terminal:
   ```powershell
   node server/server.js
   ```
2. El sistema abrirá automáticamente el navegador en:
   **`http://localhost:3460`**

---

## 👥 Credenciales de Acceso por Perfil

| Rol Oficial | Correo Electrónico | Contraseña | Responsabilidad Principal |
| :--- | :--- | :---: | :--- |
| **Director General** (Super Admin) | `admin@recuperacionesnaranjo.com` | `admin123` | Control total, configuración y auditoría |
| **Vigilante Garita & Báscula** | `vigilante@recuperacionesnaranjo.com` | `vigi123` | Garita peatonal, EPP y camiones de chatarra |
| **Jefe de Patio y Cuadrillas** | `jefepatio@recuperacionesnaranjo.com` | `patio123` | Monitoreo en vivo de cuadrillas y maquinaria pesada |
| **Contabilidad & RRHH** | `contabilidad@recuperacionesnaranjo.com` | `conta123` | Pre-liquidación de nómina 42h y exportación Siigo |

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

---

## 👷 Padrón de Trabajadores y Cédulas Oficiales (14 Colaboradores)

| Cédula (CC) | Código | Nombre del Trabajador | Cargo Oficial | Departamento / Área | Criticidad |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **73189450** | `EMP-001` | Jorge Eliécer Naranjo | Jefe de Patio | Patio y Operaciones | **Crítico** |
| **73204911** | `EMP-002` | Manuel Antonio Herrera | Operador Grúa Pulpo #1 | Maquinaria Pesada | **Crítico** |
| **1047412890** | `EMP-003` | Wilfrido Mendoza Polo | Operador Grúa Pulpo #2 | Maquinaria Pesada | **Crítico** |
| **73155823** | `EMP-004` | Carlos Mario Berrío | Operador de Montacargas | Maquinaria Pesada | **Crítico** |
| **91438902** | `EMP-005` | Pedro Pablo Caicedo | Mecánico de Planta | Mantenimiento y Taller | **Crítico** |
| **1048220199** | `EMP-006` | Everaldo Ballestas | Ayudante de Patio | Patio y Clasificación | Ordinario |
| **1050893412** | `EMP-007` | Luis Fernando Puello | Ayudante de Patio | Patio y Clasificación | Ordinario |
| **73561209** | `EMP-008` | Gustavo Adolfo Zúñiga | Oxigenista / Clasificador | Oxicorte y Desguace | **Crítico** |
| **73120485** | `EMP-009` | Roberto Vargas | Operador Báscula / Garita | Seguridad y Pesaje | **Crítico** |
| **45512903** | `EMP-010` | Beatriz Morales | Contador General | Administración y Finanzas | Ordinario |
| **1047399820** | `EMP-011` | Diana Marcela Torres | Auxiliar Contable | Administración y Finanzas | Ordinario |
| **32890451** | `EMP-012` | Martha Mercado | Auxiliar Administrativo | Administración | Ordinario |
| **1143419082** | `EMP-013` | Kevin Castillo | Auxiliar SENA (Productiva) | Talento Humano / SENA | Formativo |
| **1051892301** | `EMP-014` | Estefany Salazar | Auxiliar SENA (Lectiva) | Talento Humano / SENA | **Suspendido** |

---

## 🌟 Módulos Clave Implementados

1. **Terminal Kiosco Táctil con Cédula:**
   - Teclado numérico gigante en pantalla para operarios con guantes industriales.
   - Escaneo de código de barras PDF417 de cédula colombiana en 300 ms.
   - Cálculo automático de tolerancia (10 minutos) contra el horario oficial del día.
   - Control estricto Anti-Passback y alerta sonora/visual con foto del trabajador.
2. **Supervisión de Patio y Cuadrillas en Vivo (Jefe de Patio):**
   - Semáforo en tiempo real de cuadrillas: Maquinaria Pesada, Mantenimiento, Ayudantes y Administración.
   - **Alerta de Maquinaria Crítica a los 15 minutos:** Notificación inmediata si falta el Operador de Grúa Pulpo #1, Pulpo #2 o Montacargas.
   - Autorización de jornadas extraordinarias de fin de semana para personal de patio.
3. **Motor de Nómina 42h (CST / Ley 2101):**
   - Distribución de horas ordinarias (hasta 42h semanales).
   - Cálculo de Horas Extras Diurnas (HED +25%), Nocturnas (HEN +75%), Recargo Nocturno (RN +35%) y Dominicales/Festivos (RDF +75%/100%).
   - Exportador a archivo CSV/Excel listo para importar en Siigo, World Office o Helisa.
4. **Portería y Báscula Camionera:**
   - Control de camiones y proveedores de chatarra con placa de vehículo, procedencia y gafete asignado.
   - Control de aforo máximo en planta (150 personas) para planes de emergencia y ARL.

---

## 📁 Estructura del Proyecto

```
G:\PROGRAMAS\ControlAcceso_RecuperacionesNaranjo\
├── database/
│   ├── db.json               # Base de datos persistente (semillas Naranjo)
│   └── schema.sql            # Esquema relacional SQL oficial
├── docs/
│   ├── 09_Plan_Sistema_Acceso_Recuperaciones_Naranjo.md
│   └── diagramas_naranjo_png/ # 8 diagramas técnicos en alta resolución (2000x1250 px)
├── public/
│   ├── app.js                # Lógica SPA, Kiosco táctil y Cuadrillas en Vivo
│   ├── index.html            # Interfaz moderna con paleta Naranja/Acero
│   └── styles.css            # Hoja de estilos corporativa industrial
├── scripts/
│   ├── generar_diagramas_naranjo_png.py
│   ├── generar_documento_naranjo_word.py
│   ├── qa-test-suite.js      # 16 pruebas automatizadas (100% PASS)
│   └── test-sql-syntax.js
├── server/
│   ├── presets.js            # Semillas oficiales de Recuperaciones Naranjo
│   ├── security.js           # Motor IAM (scrypt + HMAC-SHA256)
│   └── server.js             # API REST con motor 42h y cuadrillas
├── Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx # Plan maestro en Word
├── iniciar-sistema.bat       # Lanzador en un clic (puerto 3460)
├── package.json              # Metadatos del proyecto Node.js
└── README.md                 # Guía general de uso
```
