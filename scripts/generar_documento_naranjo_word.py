# -*- coding: utf-8 -*-
"""
Generador del Documento Word (.docx) Ejecutivo y Técnico Completo:
Plan Maestro del Sistema Integral de Control de Acceso Físico, Asistencia 42h (L-V),
Patio de Operaciones y Seguridad Industrial para Recuperaciones Naranjo Recycling S.A.S. (Cartagena).
Incorpora la estructura real de cargos de la empresa:
- Patio: Jefe de Patio, Operadores de Maquinaria (1 Montacargas, 2 Grúas Pulpo), Mecánico de Planta, Ayudantes de Patio y Oxigenistas.
- Administración: Contadores, Auxiliar Contable, Auxiliares Administrativos y Auxiliares SENA.
Inserta los 8 diagramas oficiales PNG en alta resolución y la tabla oficial de horarios.
"""
import os
import sys
import datetime
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
DIAG_DIR = os.path.join(DOCS_DIR, 'diagramas_naranjo_png')
OUT_DOCX_ROOT = os.path.join(BASE_DIR, 'Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx')
OUT_DOCX_DOCS = os.path.join(DOCS_DIR, 'Plan_Sistema_Acceso_Recuperaciones_Naranjo_Cartagena.docx')

# Paleta Corporativa Industrial / Recuperaciones Naranjo
NARANJA_CORP = RGBColor(0xEA, 0x58, 0x0C)       # #EA580C
AZUL_ACERO = RGBColor(0x0F, 0x17, 0x2A)         # #0F172A
AZUL_MEDIO = RGBColor(0x1E, 0x40, 0xAF)         # #1E40AF
FONDO_TABLA_HEADER = RGBColor(0x1E, 0x29, 0x3B) # #1E293B
FONDO_FILA_ALT = RGBColor(0xF8, 0xFA, 0xFC)     # #F8FAFC
FONDO_CALLOUT = RGBColor(0xFF, 0xF7, 0xED)      # #FFF7ED
TEXTO_GRIS = RGBColor(0x33, 0x41, 0x55)         # #334155
TEXTO_MUTED = RGBColor(0x64, 0x74, 0x8B)        # #64748B
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)

def set_cell_bg(cell, rgb: RGBColor):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    hex_color = '{:02X}{:02X}{:02X}'.format(rgb[0], rgb[1], rgb[2])
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_borders(cell, color='CBD5E1', sz=4):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ('top', 'left', 'bottom', 'right'):
        b = OxmlElement(f'w:{side}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), str(sz))
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tcBorders.append(b)
    tcPr.append(tcBorders)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in (('top', top), ('bottom', bottom), ('left', left), ('right', right)):
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_field(p, field_text):
    run = p.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = field_text
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    r = run._r
    r.append(fldChar1)
    r.append(instrText)
    r.append(fldChar2)
    r.append(fldChar3)
    run.font.size = Pt(8.5)
    run.font.color.rgb = TEXTO_MUTED

def configure_header_footer(doc):
    for section in doc.sections:
        section.top_margin = Cm(2.2)
        section.bottom_margin = Cm(2.2)
        section.left_margin = Cm(2.3)
        section.right_margin = Cm(2.3)

        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Recuperaciones Naranjo Recycling S.A.S. — Control de Acceso, Asistencia 42h y Cargos de Planta (Cartagena)")
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = TEXTO_MUTED

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = fp.add_run("Recuperaciones Naranjo S.A.S.  |  Control de Acceso, Horario 42h y Patio  |  Página ")
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = TEXTO_MUTED
        add_field(fp, "PAGE")
        r2 = fp.add_run(" de ")
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = TEXTO_MUTED
        add_field(fp, "NUMPAGES")

def add_hr(doc, color='EA580C', sz=12):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), str(sz))
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), color)
    pBdr.append(bottom)
    pPr.append(pBdr)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)

def add_h1(doc, text):
    p = doc.add_heading(level=1)
    run = p.add_run(text)
    run.font.name = 'Segoe UI'
    run.font.size = Pt(15.5)
    run.font.bold = True
    run.font.color.rgb = AZUL_ACERO
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(4)
    add_hr(doc, 'EA580C', 14)

def add_h2(doc, text):
    p = doc.add_heading(level=2)
    run = p.add_run(text)
    run.font.name = 'Segoe UI'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = NARANJA_CORP
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)

def add_h3(doc, text):
    p = doc.add_heading(level=3)
    run = p.add_run(text)
    run.font.name = 'Segoe UI'
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = AZUL_MEDIO
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)

def add_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.font.name = 'Segoe UI'
        rb.font.size = Pt(9.5)
        rb.font.bold = True
        rb.font.color.rgb = AZUL_ACERO
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(9.5)
    r.font.color.rgb = TEXTO_GRIS
    return p

def add_bullet(doc, bold_lead, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    rb = p.add_run(bold_lead)
    rb.font.name = 'Segoe UI'
    rb.font.size = Pt(9)
    rb.font.bold = True
    rb.font.color.rgb = AZUL_ACERO
    r = p.add_run(text)
    r.font.name = 'Segoe UI'
    r.font.size = Pt(9)
    r.font.color.rgb = TEXTO_GRIS

def add_callout(doc, title, text, border_color='EA580C', bg_color=FONDO_CALLOUT):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_bg(cell, bg_color)
    
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), '24')
    left.set(qn('w:space'), '0')
    left.set(qn('w:color'), border_color)
    tcBorders.append(left)
    
    for side in ('top', 'bottom', 'right'):
        b = OxmlElement(f'w:{side}')
        b.set(qn('w:val'), 'none')
        tcBorders.append(b)
    tcPr.append(tcBorders)
    set_cell_margins(cell, 90, 90, 140, 140)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    rt = p.add_run(f"📌 {title}\n")
    rt.font.name = 'Segoe UI'
    rt.font.size = Pt(9.5)
    rt.font.bold = True
    rt.font.color.rgb = AZUL_ACERO

    rc = p.add_run(text)
    rc.font.name = 'Segoe UI'
    rc.font.size = Pt(9)
    rc.font.color.rgb = TEXTO_GRIS

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_styled_table(doc, headers, rows):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        set_cell_bg(hdr_cells[i], FONDO_TABLA_HEADER)
        set_cell_borders(hdr_cells[i], '334155', 6)
        set_cell_margins(hdr_cells[i], 90, 90, 110, 110)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(str(h_text))
        run.font.name = 'Segoe UI'
        run.font.size = Pt(9)
        run.font.bold = True
        run.font.color.rgb = BLANCO

    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg = FONDO_FILA_ALT if r_idx % 2 == 1 else BLANCO
        for c_idx, val in enumerate(row_data):
            set_cell_bg(row_cells[c_idx], bg)
            set_cell_borders(row_cells[c_idx], 'CBD5E1', 4)
            set_cell_margins(row_cells[c_idx], 80, 80, 100, 100)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(str(val))
            run.font.name = 'Segoe UI'
            run.font.size = Pt(8.5)
            if c_idx == 0:
                run.font.bold = True
                run.font.color.rgb = AZUL_ACERO
            else:
                run.font.color.rgb = TEXTO_GRIS

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_diagram_image(doc, filename, caption):
    img_path = os.path.join(DIAG_DIR, filename)
    if not os.path.exists(img_path):
        add_p(doc, f"[Diagrama no encontrado: {img_path}]")
        return
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    run = p_img.add_run()
    run.add_picture(img_path, width=Inches(6.4))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_after = Pt(10)
    rc = p_cap.add_run(f"Figura Oficial: {caption} (docs/diagramas_naranjo_png/{filename})")
    rc.font.name = 'Segoe UI'
    rc.font.size = Pt(8.5)
    rc.font.italic = True
    rc.font.color.rgb = NARANJA_CORP

def build_naranjo_document():
    doc = Document()
    configure_header_footer(doc)

    # PORTADA
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_before = Pt(36)
    r_badge = p_top.add_run("PLAN MAESTRO DE TRANSFORMACIÓN & INGENIERÍA DE SOFTWARE")
    r_badge.font.name = 'Segoe UI'
    r_badge.font.size = Pt(10)
    r_badge.font.bold = True
    r_badge.font.color.rgb = NARANJA_CORP

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(16)
    r_title = p_title.add_run("SISTEMA INTEGRAL DE CONTROL DE ACCESO, ASISTENCIA 42H Y PORTERÍA INDUSTRIAL\nRECUPERACIONES NARANJO RECYCLING S.A.S.")
    r_title.font.name = 'Segoe UI'
    r_title.font.size = Pt(19)
    r_title.font.bold = True
    r_title.font.color.rgb = AZUL_ACERO

    add_hr(doc, 'EA580C', 20)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(6)
    p_sub.paragraph_format.space_after = Pt(18)
    r_sub = p_sub.add_run(
        "Sede Industrial Cartagena de Indias (Bolívar, Colombia) — Solución especializada para el registro de entrada "
        "y salida de operarios mediante Cédula de Ciudadanía en Pantalla Kiosco Táctil, Horario Oficial Lunes a Viernes de 42 Horas Semanales "
        "(según Memorando Corporativo y Ley 2101 / CST), Gestión de Cargos de Patio (Jefe de Patio, 2 Grúas Pulpo, 1 Montacargas, Mecánico de Planta, "
        "Ayudantes de Patio y Oxigenistas), Administración (Contadores, Auxiliar Contable, Auxiliares Administrativos y Aprendices SENA), "
        "Monitoreo de Cuadrilla en Vivo, Pre-Liquidación de Nómina y Modo Garita Offline-First."
    )
    r_sub.font.name = 'Segoe UI'
    r_sub.font.size = Pt(9.5)
    r_sub.font.color.rgb = TEXTO_GRIS

    add_styled_table(doc, ["Parámetro Institucional", "Detalle de Implementación"], [
        ["Empresa Beneficiaria", "Recuperaciones Naranjo Recycling S.A.S."],
        ["Ubicación de Operaciones", "Cartagena de Indias, Bolívar, Colombia (Zona Industrial)"],
        ["Rubro Operativo", "Reciclaje de Metales, Chatarrización, Desintegración Vehicular y Disposición Final"],
        ["Horario Oficial Lunes a Viernes", "42 Horas Semanales: Lunes (8:00–16:30, alm 1.5h), Mar/Vie (7:30–17:00, alm 1h), Mié/Jue (7:30–17:30, alm 1h)"],
        ["Cargos Operativos de Patio", "Jefe de Patio, Operador Grúa Pulpo #1, Operador Grúa Pulpo #2, Operador Montacargas, Mecánico de Planta, Ayudantes de Patio, Oxigenistas"],
        ["Cargos Administrativos", "Contadores, Auxiliar Contable, Auxiliares Administrativos, Auxiliares SENA (Aprendices en etapa lectiva/productiva)"],
        ["Régimen Fin de Semana (Patio)", "Sábados, Domingos y Festivos: NO laboral para Administración. Laboral extraordinario para Patio con recargos de Ley (HED 25%, HEN 75%, Dominical 75%/100%)"],
        ["Mecanismo Principal de Fichaje", "Digitación de Cédula de Ciudadanía en Kiosco Táctil Industrial + Lector de Código de Barras / QR"],
        ["Monitoreo para Jefes de Patio", "Tablero Móvil 'Mi Cuadrilla en Vivo' con semáforo y alertas de puestos críticos de maquinaria a los 15 min"],
        ["Continuidad de Servicio", "Arquitectura Garita Offline-First con base de datos local SQLite y respaldo de energía UPS"],
        ["Fecha de Formulación", datetime.date.today().strftime("%d de %B de %Y")]
    ])

    doc.add_page_break()

    # =========================================================================
    # CAPÍTULO 1
    # =========================================================================
    add_h1(doc, "1. Visión del Proyecto y Contexto Operativo en Cartagena")
    add_p(doc, 
        "Recuperaciones Naranjo Recycling S.A.S. es una empresa líder en la recuperación ambiental de metales ferrosos y no ferrosos, "
        "chatarrización pesada y desintegración vehicular en Cartagena de Indias. Las instalaciones de la planta combinan el ingreso "
        "continuo de vehículos de carga pesada (tractomulas, camiones recolectores) con el flujo de personal operativo de patio "
        "(operadores de grúas pulpo, montacargas, mecánicos de mantenimiento, oxigenistas y ayudantes de clasificación) y el equipo "
        "administrativo (contadores, auxiliares contables, administrativos y aprendices SENA). La automatización del control de acceso "
        "garantiza exactitud en el pago de nómina, control de aforo para SST/ARL y supervisión en tiempo real de cuadrillas."
    )

    add_callout(doc, "Objetivo Central de la Solución", 
        "Permitir que todo operario y colaborador que ingrese a las instalaciones de Recuperaciones Naranjo en Cartagena "
        "registre su entrada y salida en menos de 1 segundo mediante su Cédula de Ciudadanía en una pantalla táctil industrial, "
        "controlando la puntualidad frente al horario oficial de 42 horas semanales, informando en tiempo real al jefe de patio "
        "sobre la disponibilidad de sus operadores de maquinaria y suministrando a Gestión Humana la pre-liquidación exacta de horas extras y recargos.",
        border_color='EA580C'
    )

    add_diagram_image(doc, "01_Casos_De_Uso_Recuperaciones_Naranjo.png", "Diagrama 01: Casos de Uso del Sistema de Control de Acceso y Asistencia")

    # =========================================================================
    # CAPÍTULO 2: ESTRUCTURA ORGANIZACIONAL Y CARGOS REALES
    # =========================================================================
    add_h1(doc, "2. Estructura Organizacional, Cargos y Perfiles Operativos")
    add_p(doc, 
        "El sistema parametriza de forma diferenciada las dos grandes áreas de la empresa, reconociendo las responsabilidades, "
        "niveles de criticidad y dinámicas horarias de cada cargo:"
    )

    add_styled_table(doc, ["Área / Departamento", "Cargo Oficial", "Tipo de Personal", "Puesto Crítico", "Jornada y Horario Base", "Régimen Fin de Semana"], [
        ["Patio / Supervisión", "Jefe de Patio", "Operativo / Mando", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sáb/Dom/Festivo (Supervisión y Aprobación Extras)"],
        ["Patio / Maquinaria Pesada", "Operador Grúa Pulpo #1", "Operativo Patio", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sáb/Dom/Festivo si hay cargue urgente (HED/HEN/RDF)"],
        ["Patio / Maquinaria Pesada", "Operador Grúa Pulpo #2", "Operativo Patio", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sáb/Dom/Festivo si hay cargue urgente (HED/HEN/RDF)"],
        ["Patio / Maquinaria Pesada", "Operador de Montacargas", "Operativo Patio", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sáb/Dom/Festivo movimiento de chatarra/pallets"],
        ["Patio / Mantenimiento", "Mecánico de Planta", "Operativo Técnico", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sábados para mantenimiento preventivo de máquinas"],
        ["Patio / Cuadrilla General", "Ayudantes de Patio", "Operativo Patio", "NO", "Lunes a Viernes 42h", "Sáb/Dom/Festivo según requerimiento de cuadrilla"],
        ["Patio / Oxicorte", "Oxigenista / Clasificador", "Operativo Patio", "SÍ (Crítico)", "Lunes a Viernes 42h", "Sábados en jornadas de corte de vigas/estructuras"],
        ["Portería y Pesaje", "Operador Báscula / Garita", "Operativo Control", "SÍ (Crítico)", "Lunes a Viernes 42h", "Turno especial si entran camiones en fin de semana"],
        ["Administración / Contable", "Contadores / Contador General", "Administrativo", "NO", "Lunes a Viernes 42h", "NO LABORAL (Descanso obligatorio remunerado)"],
        ["Administración / Contable", "Auxiliar Contable", "Administrativo", "NO", "Lunes a Viernes 42h", "NO LABORAL (Descanso obligatorio remunerado)"],
        ["Administración / Gestión", "Auxiliares Administrativos", "Administrativo", "NO", "Lunes a Viernes 42h", "NO LABORAL (Descanso obligatorio remunerado)"],
        ["Administración / SENA", "Auxiliares SENA (Aprendices)", "Aprendices Apoyo", "NO", "Lunes a Viernes 42h", "NO LABORAL (Estricto según Contrato de Aprendizaje)"]
    ])

    add_h2(doc, "Particularidades Operativas por Cargo")
    add_bullet(doc, "1. Operadores de Maquinaria Pesada (2 Pulpos y 1 Montacargas): ", 
        "Son el corazón del movimiento de chatarra y alimentación de prensas. Su presencia puntual es indispensable para que los ayudantes de patio y camiones puedan operar. Si uno de ellos falta, el sistema dispara alerta inmediata al Jefe de Patio.")

    add_bullet(doc, "2. Mecánico de Planta / Mantenimiento: ", 
        "Mantiene operativas las grúas pulpo, el montacargas y los sistemas hidráulicos. Frecuentemente labora los sábados aprovechando que la planta tiene menor afluencia para realizar mantenimientos mayores.")

    add_bullet(doc, "3. Ayudantes de Patio: ", 
        "Cuadrilla de clasificación manual, separación de metales, estiba y apoyo en patio. Fichan masivamente en garita y su tiempo se computa al minuto.")

    add_bullet(doc, "4. Personal Administrativo (Contadores, Auxiliares Contables y Administrativos): ", 
        "Laboran estrictamente en la jornada ordinaria de lunes a viernes (42 horas). No laboran sábados ni domingos, salvo cierres de balance autorizados.")

    add_bullet(doc, "5. Auxiliares SENA (Aprendices en Etapa Lectiva o Productiva): ", 
        "Bajo la legislación colombiana (Ley 789 de 2002), su vinculación es formativa mediante contrato de aprendizaje. El sistema garantiza que no se les asignen horas extras y genera el certificado de cumplimiento de asistencia quincenal para el SENA.")

    # =========================================================================
    # CAPÍTULO 3: TABLA OFICIAL DE HORARIOS
    # =========================================================================
    add_h1(doc, "3. Horario Laboral Oficial de la Empresa (Memorando Septiembre 2026)")
    add_p(doc, 
        "Conforme al Comunicado Oficial emitido por la Gerencia de Recuperaciones Naranjo Recycling S.A.S., el horario de trabajo "
        "de lunes a viernes distribuye exactamente 42 horas semanales ordinarias, en estricto cumplimiento del Código Sustantivo del Trabajo "
        "y la Ley 2101 de Colombia:"
    )

    add_styled_table(doc, ["Día de la Semana", "Hora de Entrada", "Inicio Almuerzo", "Fin Almuerzo", "Hora de Salida", "Horas Netas Ordinarias"], [
        ["Lunes", "8:00 AM", "12:00 PM", "1:30 PM (1.5 h)", "4:30 PM", "7.0 Horas"],
        ["Martes", "7:30 AM", "12:00 PM", "1:00 PM (1.0 h)", "5:00 PM", "8.5 Horas"],
        ["Miércoles", "7:30 AM", "12:00 PM", "1:00 PM (1.0 h)", "5:30 PM", "9.0 Horas"],
        ["Jueves", "7:30 AM", "12:00 PM", "1:00 PM (1.0 h)", "5:30 PM", "9.0 Horas"],
        ["Viernes", "7:30 AM", "12:00 PM", "1:00 PM (1.0 h)", "5:00 PM", "8.5 Horas"],
        ["Sábado", "NO LABORAL (Admin/SENA)", "—", "—", "—", "Jornada Extra Patio (HED +25%)"],
        ["Domingo / Festivo", "NO LABORAL (Admin/SENA)", "—", "—", "—", "Jornada Extra Patio (Recargo +75%/100%)"],
        ["TOTAL SEMANAL", "—", "—", "—", "—", "42.0 Horas Ordinarias"]
    ])

    add_diagram_image(doc, "02_Arquitectura_Capas_Y_Motor_42Horas.png", "Diagrama 02: Arquitectura en Capas y Motor de Liquidación Horaria (42h L-V)")

    # =========================================================================
    # CAPÍTULO 4: EL KIOSCO TÁCTIL
    # =========================================================================
    add_h1(doc, "4. El Kiosco de Garita: Experiencia del Trabajador con Cédula")
    add_p(doc, 
        "En la portería peatonal se ubicará una pantalla táctil industrial (All-in-One de 15 a 21 pulgadas) empotrada a la pared "
        "o en tótem metálico. La interfaz está diseñada para operarios con guantes o equipo de protección personal (EPP):"
    )

    add_bullet(doc, "1. Pantalla Numérica Gigante: ", "Teclado táctil en pantalla con teclas de 80x80 px para digitar cómodamente la Cédula de Ciudadanía.")
    add_bullet(doc, "2. Escaneo Opcional con Código de Barras: ", "Lector láser integrado que permite escanear el código PDF417 al reverso de la cédula colombiana física o carnet corporativo en 300 ms sin necesidad de digitar.")
    add_bullet(doc, "3. Verificación Instantánea de Tolerancia: ", "El backend compara la hora de marcación contra el horario del día (Lunes 8:00 AM, Martes-Viernes 7:30 AM). Si llega dentro de los 10 minutos de gracia, registra 'PUNTUAL'; si supera los 10 minutos, calcula la tardanza exacta.")
    add_bullet(doc, "4. Control Anti-Passback Estricto: ", "Si el operario ya ingresó a la planta y no ha registrado salida, el sistema bloquea una segunda entrada fraudulenta y le solicita marcar Salida.")
    add_bullet(doc, "5. Retroalimentación Visual y Sonora: ", "Pantalla verde con foto oficial y tono de aprobación para ingreso exitoso; pantalla roja con tono grave si tiene la credencial suspendida o si intenta una marcación inválida.")
    add_bullet(doc, "6. Registro de Salida y Jornada Diaria: ", "Al terminar el turno, el trabajador vuelve a digitar su cédula; el sistema registra la SALIDA y le muestra en pantalla: '¡Buen descanso, Carlos! Salida registrada (05:04 PM) — Jornada: 8h 34min'.")

    add_diagram_image(doc, "03_Secuencia_Fichaje_Kiosco_Cedula.png", "Diagrama 03: Secuencia — Fichaje en Kiosco Táctil con Cédula de Ciudadanía")

    # =========================================================================
    # CAPÍTULO 5: PORTAL JEFE DE PATIO
    # =========================================================================
    add_h1(doc, "5. Portal del Jefe de Área / Supervisor de Patio en Tiempo Real")
    add_p(doc, 
        "El Jefe de Patio cuenta con una web app móvil para supervisar la disponibilidad de sus cuadrillas y maquinaria pesada:"
    )

    add_styled_table(doc, ["Módulo del Jefe de Patio", "Detalle Técnico y Funcional", "Beneficio para Recuperaciones Naranjo"], [
        ["Tablero 'Mi Cuadrilla en Vivo'", "Muestra en tiempo real: Trabajadores asignados al área, Total presentes en planta, Total ausentes y Tardanzas acumuladas.", "Permite reasignar labores o convocar relevos inmediatamente al inicio del turno."],
        ["Semáforo de Asistencia por Operario", "Verde: Presente y puntual. Amarillo: Llegó con tardanza (indica minutos). Rojo: Ausente sin justificar.", "Diagnóstico visual en 5 segundos sin tener que pasar lista con papel y lápiz."],
        ["Alertas de Maquinaria Pesada (15 min)", "A las 7:45 AM (Mar-Vie) u 8:15 AM (Lunes), alerta al celular si falta el Operador de Grúa Pulpo #1, Pulpo #2 o Montacargas.", "Evita paradas operativas en patio por falta de operadores de maquinaria clave."],
        ["Autorización de Extras de Fin de Semana", "El jefe puede autorizar desde su celular la jornada de sábado, domingo o festivo de los operarios que se requieren en patio.", "Control estricto de horas extras, evitando pagos no justificados en nómina."],
        ["Historial de Asistencia y Puntualidad", "Consulta por trabajador de los últimos 30 días con gráficos de puntualidad, días laborados y horas acumuladas.", "Herramienta objetiva para evaluaciones de desempeño y bonificaciones."]
    ])

    add_diagram_image(doc, "04_Secuencia_Monitoreo_Cuadrilla_Jefe_Patio.png", "Diagrama 04: Secuencia — Monitoreo de Cuadrilla y Alertas de Maquinaria Pesada")

    # =========================================================================
    # CAPÍTULO 6: MOTOR DE LIQUIDACIÓN Y NÓMINA
    # =========================================================================
    add_h1(doc, "6. Motor de Liquidación de Jornadas y Horas Extras (CST Colombia)")
    add_p(doc, 
        "El motor de cálculo clasifica automáticamente cada marcación según la legislación laboral colombiana y el memorando de la empresa:"
    )

    add_bullet(doc, "• Horas Ordinarias (HOD): ", "Acumulación de hasta 42 horas semanales distribuidas de lunes a viernes según la tabla oficial.")
    add_bullet(doc, "• Horas Extras Diurnas (HED +25%): ", "Horas laboradas que superen la jornada diaria oficial de lunes a viernes, o todo el tiempo laborado el sábado por personal de patio.")
    add_bullet(doc, "• Horas Extras Nocturnas (HEN +75%): ", "Horas extras laboradas entre las 21:00 y las 06:00.")
    add_bullet(doc, "• Recargo Nocturno (RN +35%): ", "Horas ordinarias laboradas dentro de la franja nocturna (21:00 a 06:00).")
    add_bullet(doc, "• Horas Dominicales y Festivas (RDF +75%/100%): ", "Horas laboradas en domingos o días feriados por el personal operativo de patio, con opción de descanso compensatorio o pago.")
    add_bullet(doc, "• Exportación a Software Contable: ", "Generación de archivo Excel (.xlsx) y CSV compatible con Siigo, World Office, Novasoft, Helisa o SAP.")

    add_diagram_image(doc, "05_Flujo_Liquidacion_Jornadas_Y_Horas_Extras.png", "Diagrama 05: Flujo de Actividades — Liquidación de Jornadas 42h y Recargos de Patio")
    add_diagram_image(doc, "06_Estados_Trabajador_Y_Ciclo_Turno.png", "Diagrama 06: Máquina de Estados — Ciclo de Turno del Colaborador en Planta")

    # =========================================================================
    # CAPÍTULO 7: MODELO DE DATOS Y DESPLIEGUE FÍSICO
    # =========================================================================
    add_h1(doc, "7. Modelo de Datos Relacional y Despliegue en Planta")
    add_p(doc, 
        "La arquitectura de persistencia de datos de Recuperaciones Naranjo Recycling S.A.S. ha sido diseñada bajo estrictos "
        "principios de normalización en Tercera Forma Normal (3NF), garantizando integridad referencial, trazabilidad inmutable y "
        "alto desempeño para el fichaje concurrente en garita:"
    )

    add_h2(doc, "7.1 Modelo Entidad-Relación (MER / ERD) Conceptual y Lógico")
    add_p(doc, 
        "El Modelo Entidad-Relación articula el ecosistema operativo de la empresa, distinguiendo entidades fuertes (Configuración, Departamentos, "
        "Zonas Físicas, Turnos 42h, Roles y Permisos) y entidades dependientes o transaccionales (Cargos, Trabajadores, Registros de Kiosco, "
        "Pre-liquidaciones Diarias, Autorizaciones de Extras, Pesajes de Báscula y Sesiones):"
    )

    add_diagram_image(doc, "07_Modelo_Entidad_Relacion_ERD_Naranjo.png", "Diagrama 07: Modelo Entidad-Relación (MER / ERD) — Recuperaciones Naranjo Recycling S.A.S.")

    add_styled_table(doc, ["Entidad del MER", "Tipo de Entidad", "Identificador Primario", "Descripción y Regla de Negocio"], [
        ["CONFIGURACION_EMPRESA", "Fuerte / Maestra", "id (PK)", "NIT 901.884.219-5, jornada de 42h (Ley 2101), tolerancia de 10 min y aforo máximo de 150 personas."],
        ["DEPARTAMENTOS", "Fuerte / Catálogo", "id (PK), codigo (UK)", "Áreas de la empresa: Patio de Chatarra, Taller Mecánico, Portería/Báscula y Administración."],
        ["CARGOS", "Débil (FK Depto)", "id (PK), codigo (UK)", "Puestos oficiales: Jefe de Patio, 2 Pulpos, Montacargas, Mecánico, Ayudantes, Contabilidad y SENA."],
        ["TRABAJADORES", "Débil (FK Cargo)", "id (PK), documento (UK)", "Padrón oficial de operarios. Identificado rápidamente en garita por su Cédula de Ciudadanía."],
        ["ZONAS_ACCESO", "Fuerte / Espacial", "id (PK), codigo (UK)", "Zonas físicas perimetradas: Garita, Patio, Taller de Oxicorte, Oficinas y Báscula."],
        ["REGISTROS_ACCESO", "Transaccional / Evento", "id (PK), codigo_mov (UK)", "Fichaje diario de entrada y salida con cédula, cálculo de minutos trabajados y Anti-Passback."],
        ["JORNADAS_LIQUIDADAS", "Transaccional / Nómina", "id (PK), trabajador+fecha", "Motor 42h: Desglose de HOD ordinarias, HED +25%, HEN +75%, RN +35% y RDF +75%/100%."],
        ["AUTORIZACIONES_EXTRAS", "Transaccional / Firma", "id (PK)", "Aprobación firmada por el Jefe de Patio para jornadas de sábados, domingos o festivos."],
        ["VEHICULOS_Y_BASCULA", "Transaccional / Carga", "id (PK), placa (UK), tiquete", "Pesaje de camiones de chatarra: peso bruto, tara, neto y tipo de material metálico."],
        ["CONTROL_IAM_SEGURIDAD", "Seguridad / Transaccional", "usuario_id, token_sesion", "Cuentas scrypt, 18 permisos atómicos, matriz de roles y bitácora inmutable de auditoría."]
    ])

    add_h2(doc, "7.2 Modelo Relacional Físico y Tablas Normalizadas (3NF)")
    add_p(doc, 
        "El Modelo Relacional Físico implementa las tablas normalizadas con tipos de datos exactos, restricciones de integridad referencial "
        "(ON DELETE RESTRICT para proteger historiales de nómina y ON DELETE CASCADE para tablas asociativas), índices de alta velocidad "
        "y disparadores automáticos (Triggers):"
    )

    add_diagram_image(doc, "09_Modelo_Relacional_Tablas_Fisicas.png", "Diagrama 09: Modelo Relacional Físico y Tablas Normalizadas (3NF) — Base de Datos Naranjo")

    add_p(doc, 
        "El script SQL completo de creación e inserción de datos iniciales se encuentra parametrizado en el archivo database/schema.sql, "
        "incluyendo vistas automáticas (vw_cuadrilla_en_vivo, vw_preliquidacion_quincenal_42h, vw_aforo_actual_planta) y disparadores de auditoría."
    )

    add_h2(doc, "7.3 Despliegue Físico de Hardware en Planta Cartagena")
    add_p(doc, 
        "La planta contará con infraestructura protegida contra el clima de Cartagena (alta humedad y calor industrial) y respaldo de energía UPS:"
    )

    add_bullet(doc, "• Garita Peatonal: ", "Tótem Kiosco Táctil industrial All-in-One de 19\", teclado táctil gigante, escáner láser de código de barras y luz estroboscópica verde/roja.")
    add_bullet(doc, "• Garita Vehicular / Báscula: ", "PC de vigilante con monitor espejo, visualizador de aforo, interfaz de báscula de chatarra y cámaras LPR de placas.")
    add_bullet(doc, "• Garita Offline-First: ", "Base de datos local SQLite que permite seguir marcando normalmente ante cortes de fibra óptica o internet, sincronizando en ráfaga al reanudarse la red.")
    add_bullet(doc, "• Respaldo con UPS: ", "Autonomía de 4 horas de energía para garita ante apagones o fluctuaciones eléctricas.")

    add_diagram_image(doc, "08_Despliegue_Hardware_Red_Planta_Cartagena.png", "Diagrama 08: Despliegue Físico de Hardware y Red — Planta Recuperaciones Naranjo")

    # =========================================================================
    # CAPÍTULO 8: CRONOGRAMA DE IMPLEMENTACIÓN
    # =========================================================================
    add_h1(doc, "8. Cronograma de Implementación Propuesto (4 Semanas)")
    add_styled_table(doc, ["Semana / Fase", "Hitos de Desarrollo e Implementación", "Entregables Tangibles"], [
        ["Semana 1: Horarios 42h y Padrón de Cargos", "• Parametrización del horario oficial Lunes a Viernes.\n• Carga de colaboradores: Jefe de Patio, 2 Pulpos, Montacargas, Mecánico, Ayudantes, Contadores, Auxiliares y SENA.\n• Configuración de roles y permisos.", "Base de datos parametrizada con el personal y cargos reales de Naranjo."],
        ["Semana 2: Kiosco Táctil con Cédula", "• Desarrollo de la interfaz táctil con teclado numérico gigante.\n• Integración de escáner de código de barras (PDF417).\n• Algoritmo de cálculo de puntualidad (10 min tolerancia) y Anti-Passback.", "Kiosco táctil operativo en garita para pruebas de marcación de operarios."],
        ["Semana 3: Portal del Jefe de Patio y Nómina", "• Construcción del portal móvil 'Mi Cuadrilla en Vivo' para supervisores de patio.\n• Alertas de puestos críticos de maquinaria a los 15 min.\n• Módulo de autorización de horas extras de sábado/domingo y exportador a Excel.", "Dashboard de supervisores activo y reportes de horas ordinarias/extras listos."],
        ["Semana 4: Pruebas Piloto y Salida a Producción", "• Instalación del hardware en la garita peatonal de Cartagena.\n• Capacitación de 1 hora al personal de vigilancia y supervisores.\n• Marcha blanca y salida a producción oficial.", "Planta de Cartagena operando al 100% con control de acceso digitalizado."]
    ])

    # Guardar en las dos rutas
    doc.save(OUT_DOCX_ROOT)
    doc.save(OUT_DOCX_DOCS)
    print(f"Documento Naranjo Word generado exitosamente con cargos actualizados en:\n1. {OUT_DOCX_ROOT}\n2. {OUT_DOCX_DOCS}")

if __name__ == '__main__':
    build_naranjo_document()
