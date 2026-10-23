# 🛡️ Plan Maestro: Sistema Integral de Control de Acceso, Asistencia 42h y Portería Industrial
## Empresa: Recuperaciones Naranjo Recycling S.A.S. — Sede Cartagena de Indias (Bolívar, Colombia)

> **Documento Oficial de Arquitectura y Especificación Técnica**  
> **Sistema Base:** SentinelPro Access & IAM Enterprise Edition  
> **Horario Oficial Aplicado:** 42 Horas Semanales (Lunes a Viernes) según Memorando Corporativo y Ley 2101 / CST  
> **Cargos Parametrizados:**  
> • **Patio:** Jefe de Patio, Operadores de Maquinaria (1 Montacargas, 2 Grúas Pulpo), Mecánico de Planta, Ayudantes de Patio y Oxigenistas.  
> • **Administración:** Contadores, Auxiliar Contable, Auxiliares Administrativos y Aprendices SENA.  
> **Documento Word Oficial (.docx):** [`Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx`](../Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx) *(Incluye los 8 diagramas en alta resolución incrustados y tabla de cargos)*

---

## 📑 Índice General
1. [Visión General y Contexto Operativo en Cartagena](#1-visión-general-y-contexto-operativo-en-cartagena)
2. [Estructura de Cargos: Patio de Operaciones vs Administración](#2-estructura-de-cargos-patio-de-operaciones-vs-administración)
3. [Tabla Oficial de Horarios Laborales (L-V 42 Horas) y Régimen de Patio](#3-tabla-oficial-de-horarios-laborales-l-v-42-horas-y-régimen-de-patio)
4. [El Kiosco de Garita: Fichaje con Cédula para el Trabajador](#4-el-kiosco-de-garita-fichaje-con-cédula-para-el-trabajador)
5. [Portal en Vivo para el Jefe de Área / Supervisor de Patio](#5-portal-en-vivo-para-el-jefe-de-área--supervisor-de-patio)
6. [Motor de Liquidación de Nómina: Código Sustantivo del Trabajo (Colombia)](#6-motor-de-liquidación-de-nómina-código-sustantivo-del-trabajo-colombia)
7. [Consola del Vigilante de Portería y Control de Visitantes](#7-consola-del-vigilante-de-portería-y-control-de-visitantes)
8. [Resiliencia Industrial: Garita Offline-First ante Fallas de Red](#8-resiliencia-industrial-garita-offline-first-ante-fallas-de-red)
9. [Galería de Diagramas Técnicos Oficiales (PNG y Mermaid)](#9-galería-de-diagramas-técnicos-oficiales-png-y-mermaid)
10. [Cronograma de Implementación Propuesto (4 Semanas)](#10-cronograma-de-implementación-propuesto-4-semanas)

---

## 1. Visión General y Contexto Operativo en Cartagena

**Recuperaciones Naranjo Recycling S.A.S.** es una empresa con operaciones de alta exigencia en reciclaje de metales ferrosos y no ferrosos, oxicorte, desintegración vehicular y pesaje en báscula en Cartagena de Indias.

En un entorno industrial con calor tropical, tránsito constante de camiones de carga pesada y cuadrillas de operarios en patio, el control de acceso debe cumplir con tres pilares esenciales:
- **Agilidad Extrema en Garita:** El trabajador no puede perder tiempo haciendo filas; debe ingresar digitando su Cédula de Ciudadanía en una pantalla táctil o escaneándola en menos de 1 segundo.
- **Supervisión Inmediata para el Jefe:** El director de patio y los supervisores deben saber exactamente desde su teléfono o tablet quién llegó, quién está tarde y quién faltó, para organizar la operación sin demoras.
- **Exactitud para Nómina y SST:** Saber cuántas horas laboró cada colaborador, cálculo automático de recargos nocturnos, horas extras y festivos conforme al Código Sustantivo del Trabajo de Colombia, y control de aforo estricto para planes de emergencia y ARL.

---

## 2. Estructura de Cargos: Patio de Operaciones vs Administración

El sistema parametriza los cargos de la empresa diferenciando responsabilidades, criticidad operativa y esquemas de horario:

| Área / Departamento | Cargo Oficial | Tipo de Personal | Puesto Crítico | Jornada y Horario Base | Régimen Fin de Semana |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Patio / Supervisión** | **Jefe de Patio** | Operativo / Mando | **SÍ (Crítico)** | Lunes a Viernes 42h | Sáb/Dom/Festivo (Supervisión y Aprobación Extras) |
| **Patio / Maquinaria Pesada** | **Operador Grúa Pulpo #1** | Operativo Patio | **SÍ (Crítico)** | Lunes a Viernes 42h | Sáb/Dom/Festivo si hay cargue urgente (HED/HEN/RDF) |
| **Patio / Maquinaria Pesada** | **Operador Grúa Pulpo #2** | Operativo Patio | **SÍ (Crítico)** | Lunes a Viernes 42h | Sáb/Dom/Festivo si hay cargue urgente (HED/HEN/RDF) |
| **Patio / Maquinaria Pesada** | **Operador de Montacargas** | Operativo Patio | **SÍ (Crítico)** | Lunes a Viernes 42h | Sáb/Dom/Festivo movimiento de chatarra/pallets |
| **Patio / Mantenimiento** | **Mecánico de Planta** | Operativo Técnico | **SÍ (Crítico)** | Lunes a Viernes 42h | Sábados para mantenimiento preventivo de máquinas |
| **Patio / Cuadrilla General** | **Ayudantes de Patio** | Operativo Patio | NO | Lunes a Viernes 42h | Sáb/Dom/Festivo según requerimiento de cuadrilla |
| **Patio / Oxicorte** | **Oxigenista / Clasificador** | Operativo Patio | **SÍ (Crítico)** | Lunes a Viernes 42h | Sábados en jornadas de corte de vigas/estructuras |
| **Portería y Pesaje** | **Operador Báscula / Garita** | Operativo Control | **SÍ (Crítico)** | Lunes a Viernes 42h | Turno especial si entran camiones en fin de semana |
| **Administración / Contable** | **Contadores / Contador General**| Administrativo | NO | Lunes a Viernes 42h | **NO LABORAL** (Descanso obligatorio remunerado) |
| **Administración / Contable** | **Auxiliar Contable** | Administrativo | NO | Lunes a Viernes 42h | **NO LABORAL** (Descanso obligatorio remunerado) |
| **Administración / Gestión** | **Auxiliares Administrativos** | Administrativo | NO | Lunes a Viernes 42h | **NO LABORAL** (Descanso obligatorio remunerado) |
| **Administración / SENA** | **Auxiliares SENA (Aprendices)**| Aprendices Apoyo | NO | Lunes a Viernes 42h | **NO LABORAL** (Estricto según Contrato de Aprendizaje) |

### Dinámica Operativa de los Cargos
1. **Operadores de Maquinaria Pesada (2 Pulpos y 1 Montacargas):**  
   Puestos críticos indispensables para alimentar prensas y cargar volquetas o buques. Si uno falta al inicio del turno, el sistema emite alerta inmediata a los 15 minutos al celular del Jefe de Patio.
2. **Mecánico de Planta:**  
   Encargado del mantenimiento hidráulico y mecánico de pulpos y montacargas. Frecuentemente se le programan jornadas extraordinarias los sábados para mantenimiento preventivo sin detener la producción entre semana.
3. **Ayudantes de Patio:**  
   Cuadrilla de clasificación manual, amarre, estiba y apoyo general. Fichan masivamente en garita y su tiempo se computa al minuto.
4. **Equipo Administrativo (Contadores, Auxiliar Contable y Auxiliares Administrativos):**  
   Cumplen la jornada ordinaria de 42 horas de lunes a viernes en oficinas y no laboran fines de semana.
5. **Auxiliares SENA:**  
   Estudiantes en etapa lectiva o productiva bajo contrato de aprendizaje (Ley 789 de 2002). Tienen prohibición legal de realizar horas extras; el sistema valida su horario diurno formativo de lunes a viernes.

---

## 3. Tabla Oficial de Horarios Laborales (L-V 42 Horas) y Régimen de Patio

Conforme al Memorando Oficial de la empresa, el horario laboral ordinario de **Lunes a Viernes** suma exactamente **42 Horas Semanales**, en concordancia con la Ley 2101 de 2021:

| Día de la Semana | Hora de Entrada | Inicio Almuerzo | Fin Almuerzo | Hora de Salida | Horas Ordinarias Netas |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lunes** | 8:00 AM | 12:00 PM | 1:30 PM (1.5 h) | 4:30 PM | **7.0 Horas** |
| **Martes** | 7:30 AM | 12:00 PM | 1:00 PM (1.0 h) | 5:00 PM | **8.5 Horas** |
| **Miércoles** | 7:30 AM | 12:00 PM | 1:00 PM (1.0 h) | 5:30 PM | **9.0 Horas** |
| **Jueves** | 7:30 AM | 12:00 PM | 1:00 PM (1.0 h) | 5:30 PM | **9.0 Horas** |
| **Viernes** | 7:30 AM | 12:00 PM | 1:00 PM (1.0 h) | 5:00 PM | **8.5 Horas** |
| **Sábado** | *No Laboral (Admin/SENA)* | — | — | — | **Jornada Extra Patio (HED +25%)** |
| **Domingo / Festivo** | *No Laboral (Admin/SENA)* | — | — | — | **Jornada Extra Patio (Recargo +75%/100%)** |
| **TOTAL ORDINARIO** | — | — | — | — | **42.0 Horas Semanales** |

---

## 4. El Kiosco de Garita: Fichaje con Cédula para el Trabajador

- **Pantalla Numérica Gigante:** Teclado táctil en pantalla con teclas de 80x80 px para digitar cómodamente la Cédula de Ciudadanía con guantes.
- **Escaneo Opcional con Código de Barras:** Lector láser que escanea el código PDF417 de la cédula colombiana física o carnet en 300 ms sin necesidad de digitar.
- **Verificación Instantánea de Tolerancia:** Compara contra el horario oficial del día (Lunes 8:00 AM, Martes-Viernes 7:30 AM). Si llega dentro de los 10 minutos de gracia, registra `PUNTUAL`; si supera los 10 minutos, calcula los minutos exactos de tardanza.
- **Control Anti-Passback Estricto:** Si el operario ya ingresó a la planta y no ha registrado salida, el sistema bloquea una segunda entrada fraudulenta y le solicita marcar Salida.
- **Retroalimentación Visual y Sonora:** Pantalla verde con foto oficial y tono de aprobación para ingreso exitoso; pantalla roja con tono grave si tiene la credencial suspendida o si intenta una marcación inválida.
- **Registro de Salida:** Al finalizar el turno, vuelve a digitar su cédula; el sistema registra la `SALIDA` y le muestra:  
  `👋 ¡Buen descanso, Carlos! Salida registrada (05:04 PM) — Jornada: 8h 34min`.

---

## 5. Portal en Vivo para el Jefe de Área / Supervisor de Patio

- **Tablero "Mi Cuadrilla en Vivo":** Muestra en tiempo real desde el celular o tablet: Trabajadores asignados al área, Total presentes en planta, Total ausentes y Tardanzas acumuladas.
- **Semáforo Visual de Asistencia:**
  - 🟢 **Verde:** Presente y puntual.
  - 🟡 **Amarillo:** Llegó con tardanza (indica minutos).
  - 🔴 **Rojo:** Ausente sin justificar.
- **Alerta de Maquinaria Pesada a los 15 Minutos:** A las 7:45 AM (Mar-Vie) u 8:15 AM (Lunes), alerta al celular si falta el Operador de Grúa Pulpo #1, Pulpo #2 o Montacargas.
- **Autorización de Extras de Fin de Semana:** El jefe puede autorizar desde su celular la jornada de sábado, domingo o festivo de los operarios que se requieren en patio.
- **Historial de Asistencia y Puntualidad:** Consulta por trabajador de los últimos 30 días con gráficos de puntualidad, días laborados y horas acumuladas.

---

## 6. Motor de Liquidación de Nómina: Código Sustantivo del Trabajo (Colombia)

- **Horas Ordinarias (HOD):** Acumulación de hasta 42 horas semanales distribuidas de lunes a viernes según la tabla oficial.
- **Horas Extras Diurnas (HED +25%):** Horas laboradas que superen la jornada diaria oficial de lunes a viernes, o todo el tiempo laborado el sábado por personal de patio.
- **Horas Extras Nocturnas (HEN +75%):** Horas extras laboradas entre las 21:00 y las 06:00.
- **Recargo Nocturno (RN +35%):** Horas ordinarias laboradas dentro de la franja nocturna (21:00 a 06:00).
- **Horas Dominicales y Festivas (RDF +75%/100%):** Horas laboradas en domingos o días feriados por el personal operativo de patio, con opción de descanso compensatorio o pago.
- **Exportación a Software Contable:** Generación de archivo Excel (.xlsx) y CSV compatible con Siigo, World Office, Novasoft, Helisa o SAP.

---

## 7. Consola del Vigilante de Portería y Control de Visitantes

1. **Monitor Espejo:** Cuando un operario digita su cédula en el Kiosco, la pantalla del vigilante muestra la foto oficial en grande para cotejo visual.
2. **Control de Camiones y Proveedores de Chatarra:** Registro de transportistas, proveedores y contratistas con Cédula, Nombres, Empresa de Procedencia, Placa del Camión y asignación de gafete temporal.
3. **Contador de Aforo en Vivo de Planta:** Muestra en tiempo real cuántas personas (operarios + administrativos + visitantes) se encuentran adentro para planes de emergencia y auditorías SST/ARL.

---

## 8. Resiliencia Industrial: Garita Offline-First ante Fallas de Red

- **Base de Datos Local en el Kiosco (SQLite):** El terminal de garita almacena localmente una réplica cifrada de las cédulas autorizadas y turnos.
- **Marcación Continua en Modo Offline:** Si se interrumpe la conexión con el servidor central, el Kiosco pasa automáticamente a 'Modo Local' sin detener el flujo de ingreso.
- **Sincronización Automática:** Cuando se reanuda el enlace, los registros encolados con su hora exacta se sincronizan hacia la base central sin intervención humana.
- **Respaldo con UPS:** Autonomía de 4 horas de energía para garita ante apagones o fluctuaciones eléctricas.

---

## 9. Galería de Diagramas Técnicos Oficiales (PNG y Mermaid)

### 📊 Diagrama 01: Casos de Uso por Cargo
*(Archivo PNG: [`docs/diagramas_naranjo_png/01_Casos_De_Uso_Recuperaciones_Naranjo.png`](./diagramas_naranjo_png/01_Casos_De_Uso_Recuperaciones_Naranjo.png))*

```mermaid
flowchart LR
    Maquinaria(["🏗️ Operadores Maquinaria\n(Montacargas & Pulpos)"])
    Cuadrilla(["🔧 Mecánico & Ayudantes\nde Patio / Oxigenistas"])
    AdminSena(["💼 Contadores, Auxiliares\ny Aprendices SENA"])

    Vigilante(["🛡️ Vigilante Garita"])
    JefePatio(["📱 Jefe de Patio"])
    Gerencia(["👔 Gerencia / RR.HH."])

    subgraph SistemaNaranjo["🛡️ SentinelPro Naranjo (Cartagena)"]
        CU01(["CU-01: Fichar Entrada/Salida con Cédula en Kiosco"])
        CU02(["CU-02: Escanear Código Barras Cédula Física"])
        CU03(["CU-03: Validar Horario L-V 42h y Tolerancia"])
        CU04(["CU-04: Control Anti-Passback"])
        CU05(["CU-05: Fichar Entrada a Taller (Mecánico)"])
        CU06(["CU-06: Control Asistencia Aprendices SENA"])
        CU07(["CU-07: Monitorear Cuadrilla en Vivo (Pulpos, Ayudantes)"])
        CU08(["CU-08: Autorizar Jornada Sáb/Dom/Festivo (Patio)"])
        CU09(["CU-09: Alerta Maquinaria: Falta Pulpo o Montacargas"])
        CU10(["CU-10: Monitor Espejo y Aforo en Garita"])
        CU11(["CU-11: Liquidar 42h Semanales + Extras"])
        CU12(["CU-12: Exportar a Excel (Siigo / World Office)"])
    end

    Maquinaria --> CU01
    Cuadrilla --> CU01
    Cuadrilla --> CU05
    AdminSena --> CU01
    AdminSena --> CU06
    CU01 -.-> CU03
    CU01 -.-> CU04
    JefePatio --> CU07
    JefePatio --> CU08
    CU07 -.-> CU09
    Vigilante --> CU10
    Gerencia --> CU11
    Gerencia --> CU12
```

---

### 🏛️ Diagrama 02: Arquitectura en Capas y Motor 42h
*(Archivo PNG: [`docs/diagramas_naranjo_png/02_Arquitectura_Capas_Y_Motor_42Horas.png`](./diagramas_naranjo_png/02_Arquitectura_Capas_Y_Motor_42Horas.png))*

---

### ⏱️ Diagrama 03: Secuencia — Fichaje en Kiosco con Cédula
*(Archivo PNG: [`docs/diagramas_naranjo_png/03_Secuencia_Fichaje_Kiosco_Cedula.png`](./diagramas_naranjo_png/03_Secuencia_Fichaje_Kiosco_Cedula.png))*

---

### 🚨 Diagrama 04: Secuencia — Monitoreo de Maquinaria Pesada para Jefe de Patio
*(Archivo PNG: [`docs/diagramas_naranjo_png/04_Secuencia_Monitoreo_Cuadrilla_Jefe_Patio.png`](./diagramas_naranjo_png/04_Secuencia_Monitoreo_Cuadrilla_Jefe_Patio.png))*

---

### 📈 Diagrama 05: Flujo de Liquidación 42h y Recargos de Patio
*(Archivo PNG: [`docs/diagramas_naranjo_png/05_Flujo_Liquidacion_Jornadas_Y_Horas_Extras.png`](./diagramas_naranjo_png/05_Flujo_Liquidacion_Jornadas_Y_Horas_Extras.png))*

---

### 🔄 Diagrama 06: Máquina de Estados del Trabajador
*(Archivo PNG: [`docs/diagramas_naranjo_png/06_Estados_Trabajador_Y_Ciclo_Turno.png`](./diagramas_naranjo_png/06_Estados_Trabajador_Y_Ciclo_Turno.png))*

---

### 🗄️ Diagrama 07: Modelo Entidad-Relación (MER / ERD) Naranjo
*(Archivo PNG: [`docs/diagramas_naranjo_png/07_Modelo_Entidad_Relacion_ERD_Naranjo.png`](./diagramas_naranjo_png/07_Modelo_Entidad_Relacion_ERD_Naranjo.png))*  
*(Documento detallado de especificación: [`docs/10_Modelo_Entidad_Relacion_Y_Relacional_Completo.md`](./10_Modelo_Entidad_Relacion_Y_Relacional_Completo.md))*  
*(Script SQL DDL/DML Completo: [`database/schema.sql`](../database/schema.sql))*

---

### 🌐 Diagrama 08: Despliegue Físico de Hardware y Red
*(Archivo PNG: [`docs/diagramas_naranjo_png/08_Despliegue_Hardware_Red_Planta_Cartagena.png`](./diagramas_naranjo_png/08_Despliegue_Hardware_Red_Planta_Cartagena.png))*

---

### 📑 Diagrama 09: Modelo Relacional Físico y Tablas Normalizadas (3NF)
*(Archivo PNG: [`docs/diagramas_naranjo_png/09_Modelo_Relacional_Tablas_Fisicas.png`](./diagramas_naranjo_png/09_Modelo_Relacional_Tablas_Fisicas.png))*  
Modela las 20 tablas físicas normalizadas en Tercera Forma Normal (3NF) con claves primarias (PK), claves foráneas (FK), restricciones de unicidad (UK) e integridad referencial estricta.

---

## 10. Cronograma de Implementación Propuesto (4 Semanas)

| Semana / Fase | Hitos de Desarrollo e Implementación | Entregables Tangibles |
| :---: | :--- | :--- |
| **Semana 1** | **Configuración Horario 42h y Padrón Naranjo**<br>• Parametrización del horario oficial (Lunes 8:00–16:30, Mar/Vie 7:30–17:00, Mié/Jue 7:30–17:30).<br>• Carga de Cédulas y cargos: Jefe de Patio, 2 Pulpos, Montacargas, Mecánico, Ayudantes, Contadores, Auxiliares y SENA. | Base de datos relacional parametrizada con el personal y cargos reales de Naranjo. |
| **Semana 2** | **Kiosco Táctil con Cédula de Ciudadanía**<br>• Teclado numérico gigante en pantalla para operarios con guantes.<br>• Escaneo láser de cédula colombiana física (PDF417).<br>• Cálculo de tolerancia (10 min) y control Anti-Passback. | Terminal Kiosco táctil operativo en garita peatonal para pruebas con operarios. |
| **Semana 3** | **Portal de Jefes de Patio y Motor de Nómina**<br>• Tablero 'Mi Cuadrilla en Vivo' con semáforo para supervisores de patio.<br>• Alertas de maquinaria pesada (Pulpos/Montacargas) a los 15 min.<br>• Autorización de extras de sábados/domingos y exportador a Excel. | Dashboard de supervisores activo y pre-liquidación de horas ordinarias/extras lista. |
| **Semana 4** | **Pruebas en Campo y Despliegue en Garita**<br>• Instalación en la portería industrial de Cartagena con respaldo UPS.<br>• Capacitación de 1 hora al personal de vigilancia y supervisores.<br>• Marcha blanca y salida a producción oficial. | Planta industrial de Cartagena operando al 100% con control de acceso digitalizado. |
