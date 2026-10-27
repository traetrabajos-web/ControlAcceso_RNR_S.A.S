# 📘 Guía Maestra de Mejora Integral y Hoja de Ruta
## Sistema de Control de Acceso, Asistencia 42h y Operaciones de Planta
### Recuperaciones Naranjo Recycling S.A.S. — Sede Industrial Mamonal Km 7, Cartagena

---

## 📌 Resumen Ejecutivo y Diagnóstico del Estado Actual

El sistema ha evolucionado de un prototipo básico en HTML/JS a una plataforma modular en **React 19 + TypeScript + Tailwind CSS**, con kiosco de autoservicio y consola de supervisión dividida en 11 submódulos. 

Sin embargo, para consolidar una **solución industrial de clase mundial** apta para operar en condiciones extremas de planta (tránsito pesado de chatarra, polvo, calor tropical de Mamonal, turnos rotativos y auditorías de SST/ARL), se requiere una optimización profunda en 4 dimensiones estratégicas:

1. **Diseño Visual y Lenguaje de Diseño Industrial (UI/UX)**
2. **Arquitectura de Software y Modelo de Datos**
3. **Funcionalidad Operativa y Cumplimiento Normativo (CST Colombia)**
4. **Infraestructura de Hardware, Seguridad y Resiliencia Offline**

---

## 🎨 1. Auditoría y Mejoras en Diseño Visual y UI

### 1.1 Sistema de Color y Semántica Industrial
- **Estado Actual:** Predominio de tonos genéricos de Tailwind con acentos en naranja (`orange-600`) y grises estándar (`slate-900`).
- **Problema:** En pantallas táctiles de garita expuestas al reflejo solar o en monitores industriales de patio, el contraste en grises claros (`slate-400`/`slate-500`) pierde legibilidad (falla WCAG AAA).
- **Propuesta de Mejora:**
  - **Paleta de Alto Contraste:**
    - Primario Corporativo: Naranja Industrial RNR (`#EA580C` / `#C2410C`), representativo de maquinaria pesada y reciclaje de acero.
    - Superficies de Control: Gris Carbón / Grafito (`#0F172A` a `#1E293B`) que reduce fatiga visual y disimula salpicaduras de campo.
    - Estados Semánticos Estrictos:
      - Verde Esmeralda (`#059669` / `#10B981`): Ingreso autorizado, puntual, maquinaria operativa.
      - Amarillo Tráfico (`#D97706` / `#F59E0B`): Llegada tarde, receso, mantenimiento preventivo próximo.
      - Rojo Alerta SST (`#DC2626` / `#EF4444`): Bloqueo perimetral, falta de EPP, acceso denegado, ARL inactiva.
      - Azul Operativo (`#2563EB`): Báscula metrológica, pesaje neto de carga.

### 1.2 Tipografía y Jerarquía Visual
- **Tipografía Base:** Adopción de familias tipográficas con números monoespaciados para evitar saltos visuales al actualizar relojes, pesajes y cédulas.
  - Inter o Geist Sans para texto de interfaz.
  - JetBrains Mono o Roboto Mono para: Número de Cédula (CC), Horómetro, Pesaje en Báscula (kg), Código de Movimiento y Horas de Nómina.
- **Jerarquía:** Eliminación de etiquetas tipo píldora estáticas redundantes; uso de tipografía limpia con delimitadores sutiles (`·`) y texto con peso semántico (bold/semibold).

### 1.3 Kiosco de Garita (Experiencia Táctil)
- **Zona de Toque (Touch Target):** Botones numéricos con altura mínima de `64px` a `72px`, ideales para operarios que utilizan guantes de carnaza o vaqueta.
- **Retroalimentación Visual Inmediata:**
  - Micro-animación de pulsación táctil (scale 0.96) y efecto de halo auditivo y lumínico.
  - Pantalla de bienvenida con fotografía del trabajador en alta resolución, grupo sanguíneo RH y estado de ARL visible a 2 metros de distancia para el guardia.
- **Modo Noche / Alta Luminosidad:** Selector de contraste en garita para adaptarse a la radiación solar diurna de Cartagena y turnos nocturnos.

---

## 🧱 2. Estructura de Componentes y Experiencia de Usuario (UX)

### 2.1 Navegación y Menús
- **Segmentación por Rol (Role-Based Views):**
  - El Vigilante solo debe ver el Kiosco y la Consola de Portería.
  - El Jefe de Patio solo debe ver el Módulo de Maquinaria, Horómetros y Cuadrilla.
  - Contabilidad/RRHH solo debe ver Asistencia, Nómina 42h y Trabajadores.
- **Barra de Navegación Lateral (Sidebar Colapsable):**
  - Agrupación por departamentos: *Operaciones de Campo*, *Gestión Humana & Nómina*, *Seguridad & SST*, *Configuración del Sistema*.
  - Atajos de teclado para supervisores (`Alt + K` para Kiosco, `Alt + B` para Báscula, `Alt + P` para Portería).

### 2.2 Formularios y Carga de Datos
- **Báscula Camionera:**
  - Conexión vía protocolo serial RS-232 / WebSocket directo con el indicador digital de la báscula para captura automática del peso (cero error humano al digitar kg).
  - Cálculo automático de merma por humedad o impurezas en chatarra mixta.
- **Checklist de EPP Automatizado:**
  - Integración fotográfica o confirmación rápida en 1 tap ("Todo Conforme") con advertencia en caso de ingreso a Patio de Alto Riesgo.

### 2.3 Tablas y Visualización de Datos
- **Sticky Headers y Scroll Virtual:** Tablas de asistencia optimizadas con virtualización (`react-window`) para manejar más de 10,000 marcaciones históricas sin degradar memoria.
- **Filtros Multifacéticos:** Búsqueda combinada instantánea (Fecha + Zona + Cuadrilla + Estado de Puntualidad).
- **Acciones Rápidas en Fila:** Botón directo para imprimir carnet, ver ficha 360°, descargar recibo o justificar tardanza con certificado médico.

---

## ⚡ 3. Funcionalidades Avanzadas y Cumplimiento Normativo

### 3.1 Motor Laboral Colombiano (Ley 2101 / CST)
- **Horario 42 Horas Semanales:**
  - Distribución oficial: Lunes 7h, Martes a Jueves 8.5h a 9h, Viernes 8.5h.
  - Cálculo de recargos según CST:
    - Hora Extra Diurna (HED): 25%
    - Hora Extra Nocturna (HEN): 75%
    - Hora Extra Dominical/Festiva (HEDD): 100%
    - Recargo Nocturno Festivo (HEND): 150%
- **Gestión de Incapacidades y Permisos:** Módulo para cargar soportes de EPS (Sura, Coomeva, Sanitas) y justificar inasistencias sin afectar negativamente la calificación de puntualidad.

### 3.2 Seguridad y Resiliencia en Planta (Offline-First)
- **Arquitectura PWA / Local Storage Sync:**
  - Si se interrumpe la fibra óptica o la señal celular en Mamonal, la garita sigue fichando en una base de datos local SQLite/IndexedDB cifrada.
  - En cuanto regresa la red, el sistema sincroniza automáticamente los lotes pendientes mediante HMAC-SHA256, previniendo duplicidades.
- **Protocolo de Emergencia SST (Evacuación):**
  - Disparo de sirena visual en pantalla.
  - Generación en 1 segundo del censo de personal actualmente en planta clasificado por zona para el conteo de brigadistas en el Punto de Encuentro.

---

## 🗺️ 4. Hoja de Ruta Priorizada (Roadmap de Implementación)

### 🔴 Fase 1: Inmediata (Prioridad Alta — Semanas 1 y 2)
*Impacto Crítico en Operación Diaria y Estabilidad*

| Tarea / Módulo | Descripción Técnica | Resultado Esperado |
| :--- | :--- | :--- |
| **PWA & Modo Offline Garita** | Configuración de Service Worker e IndexedDB para capturar marcaciones sin internet. | Cero caídas en garita ante cortes de energía o red en Mamonal. |
| **Checklist EPP con Bloqueo** | Si el operario entra a Patio y no marca EPP completo, se rechaza la apertura del torniquete. | Mitigación de riesgos laborales y cumplimiento ARL Sura. |
| **Cálculo de Extras en Vivo** | Totalización automática en pesos colombianos (COP) para nómina quincenal. | Reducción del 90% en tiempo de liquidación de RRHH. |
| **Optimización de Teclado Kiosco** | Aumento del tamaño de teclas a 70px y sonido de confirmación claro. | Fichaje en menos de 2 segundos por trabajador. |

### 🟡 Fase 2: Mediano Plazo (Prioridad Media — Semanas 3 y 4)
*Ampliación Operativa y Gestión de Patio*

| Tarea / Módulo | Descripción Técnica | Resultado Esperado |
| :--- | :--- | :--- |
| **Driver de Báscula RS-232** | Lectura directa por Web Serial API del peso de camiones sin tipeo manual. | Control estricto de carga y eliminación de fraudes en pesaje. |
| **Telemetría de Grúas** | Registro digital de horómetros diarios con alertas de mantenimiento cada 250 horas. | Prevención de paradas no programadas en grúas Liebherr y Fuchs. |
| **Carnetización QR Dinámica** | Generador e impresor masivo de credenciales en formato PVC con código QR seguro. | Portación obligatoria y validación visual instantánea por guardas. |
| **Auditoría IAM Avanzada** | Registro exhaustivo de IP, navegador y modificaciones en registros de tiempo. | Trazabilidad legal ante reclamos laborales o investigaciones internas. |

### 🟢 Fase 3: Consolidación y Escalamiento (Semanas 5 y 6)
*Integraciones Corporativas y Analítica Predictiva*

| Tarea / Módulo | Descripción Técnica | Resultado Esperado |
| :--- | :--- | :--- |
| **Exportación a Software Contable** | Generación de interfaces planas para Siigo, Novasoft o SAP. | Contabilización directa de costos de mano de obra y horas extras. |
| **Reconocimiento Facial de Respaldo** | Captura opcional por cámara WebRTC para verificación biométrica antifraude. | Imposibilidad de suplantación de identidad entre compañeros. |
| **Reportes Ejecutivos PDF Automatizados** | Envío dominical por correo de métricas de puntualidad, ausentismo y costos de patio. | Visibilidad directa para Gerencia General y Dirección de Operaciones. |

---

## 📈 Resumen de Beneficios Cuantificables

1. **Ahorro de Tiempo:** Reducción del tiempo de fichaje de 8 segundos a **1.5 segundos** por operario.
2. **Seguridad Industrial:** **100% de trazabilidad** de EPP y cumplimiento de aforos en zonas de alto riesgo de oxicorte y chatarrización.
3. **Control Financiero:** Eliminación de errores en el cálculo de horas extras de acuerdo con la jornada de 42 horas semanales.
4. **Disponibilidad:** Operación ininterrumpida 24/7 incluso con fallas de conectividad externa en la zona industrial.
