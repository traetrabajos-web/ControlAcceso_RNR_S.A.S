import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users,
  UserCheck,
  Plus,
  LogOut,
  CheckCircle2,
  Printer,
  X,
  Search,
  Filter,
  Clock,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  Car,
  Footprints,
  UserPlus,
  ExternalLink,
  QrCode,
  Download,
  Laptop,
  AlertTriangle,
  HardHat,
  Phone
} from 'lucide-react';
import { Visitante } from '../../../types';
import { timeToMinutes, getCurrentTimeHHMM } from '../../../utils/time';

export const VisitantesTab: React.FC = () => {
  const { visitantes, addVisitante, salidaVisitante, trabajadores } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Visitante | null>(null);
  const [exitInspectionVisitor, setExitInspectionVisitor] = useState<Visitante | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'DENTRO' | 'SALIO'>('TODOS');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');

  // Form for new visitor entry
  const [form, setForm] = useState({
    nombre_completo: '',
    documento: '',
    empresa_origen: '',
    tipo_persona: 'VISITANTE' as 'VISITANTE' | 'CONTRATISTA' | 'PROVEEDOR' | 'AUDITOR',
    placa_vehiculo: '',
    telefono_contacto: '',
    motivo_visita: 'Reunión de coordinación técnica',
    anfitrion_visitado: trabajadores.length > 0 ? trabajadores[0].nombre_completo : 'Administración General',
    gafete_asignado: `VIS-${String(visitantes.length + 1).padStart(2, '0')}`,
    zona_id: 1,
    zona_nombre: 'Portería Principal y Recepción',
    tipo_acceso: 'PEATONAL' as 'PEATONAL' | 'VEHICULAR',
    equipos_ingresados: '',
    arl_empresa: 'SURA Seguros',
    induccion_sst: true
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalHoy = visitantes.length;
    const activosDentro = visitantes.filter(v => v.estado === 'DENTRO').length;
    const salidasRegistradas = visitantes.filter(v => v.estado === 'SALIO').length;
    const contratistas = visitantes.filter(v => v.tipo_persona === 'CONTRATISTA').length;
    return { totalHoy, activosDentro, salidasRegistradas, contratistas };
  }, [visitantes]);

  // Current time in minutes for overstay checking
  const currentMinutes = useMemo(() => timeToMinutes(getCurrentTimeHHMM()), []);

  // Filtered visitors
  const filtered = useMemo(() => {
    return visitantes.filter(v => {
      const matchSearch =
        v.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.documento.includes(searchTerm) ||
        v.empresa_origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.codigo_visita.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.anfitrion_visitado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.equipos_ingresados && v.equipos_ingresados.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'TODOS' || v.estado === statusFilter;

      const matchType =
        typeFilter === 'TODOS' || v.tipo_persona === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [visitantes, searchTerm, statusFilter, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_completo.trim() || !form.documento.trim()) return;

    addVisitante({
      nombre_completo: form.nombre_completo.trim(),
      documento: form.documento.trim(),
      tipo_persona: form.tipo_persona,
      empresa_origen: form.empresa_origen.trim() || 'Particular / Independiente',
      placa_vehiculo: form.tipo_acceso === 'VEHICULAR' ? (form.placa_vehiculo.trim().toUpperCase() || 'VEH-S/P') : 'Peatonal',
      motivo_visita: form.motivo_visita,
      anfitrion_visitado: form.anfitrion_visitado,
      gafete_asignado: form.gafete_asignado || `VIS-${String(visitantes.length + 1).padStart(2, '0')}`,
      zona_id: form.zona_id,
      zona_nombre: form.zona_nombre,
      induccion_sst: form.induccion_sst,
      arl_empresa: form.arl_empresa,
      arl_vigente: true,
      equipos_ingresados: form.equipos_ingresados.trim() || undefined,
      telefono_contacto: form.telefono_contacto.trim() || undefined
    });

    setIsModalOpen(false);
    setForm({
      nombre_completo: '',
      documento: '',
      empresa_origen: '',
      tipo_persona: 'VISITANTE',
      placa_vehiculo: '',
      telefono_contacto: '',
      motivo_visita: 'Reunión de coordinación técnica',
      anfitrion_visitado: trabajadores.length > 0 ? trabajadores[0].nombre_completo : 'Administración General',
      gafete_asignado: `VIS-${String(visitantes.length + 2).padStart(2, '0')}`,
      zona_id: 1,
      zona_nombre: 'Portería Principal y Recepción',
      tipo_acceso: 'PEATONAL',
      equipos_ingresados: '',
      arl_empresa: 'SURA Seguros',
      induccion_sst: true
    });
  };

  const handleMarkExitPrompt = (v: Visitante) => {
    if (v.equipos_ingresados) {
      setExitInspectionVisitor(v);
    } else {
      salidaVisitante(v.id);
    }
  };

  const confirmExitWithInspection = () => {
    if (exitInspectionVisitor) {
      salidaVisitante(exitInspectionVisitor.id);
      setExitInspectionVisitor(null);
    }
  };

  // CSV Excel Export
  const exportVisitantesCsv = () => {
    const headers = [
      'Codigo Visita',
      'Gafete',
      'Tipo Persona',
      'Visitante',
      'Documento CC',
      'Empresa / Procedencia',
      'Telefono',
      'Persona Visitada',
      'Motivo Visita',
      'Modalidad Acceso',
      'Placa Vehiculo',
      'Equipos Declarados al Ingreso',
      'ARL',
      'Fecha',
      'Hora Ingreso',
      'Hora Salida',
      'Estado'
    ];

    const rows = filtered.map(v => [
      `"${v.codigo_visita}"`,
      `"${v.gafete_asignado}"`,
      `"${v.tipo_persona || 'VISITANTE'}"`,
      `"${v.nombre_completo}"`,
      `"${v.documento}"`,
      `"${v.empresa_origen}"`,
      `"${v.telefono_contacto || 'N/A'}"`,
      `"${v.anfitrion_visitado}"`,
      `"${v.motivo_visita}"`,
      `"${v.placa_vehiculo === 'Peatonal' ? 'Peatonal' : 'Vehicular'}"`,
      `"${v.placa_vehiculo}"`,
      `"${v.equipos_ingresados || 'Ninguno'}"`,
      `"${v.arl_empresa || 'N/A'}"`,
      `"${v.fecha}"`,
      `"${v.hora_ingreso}"`,
      `"${v.hora_salida || 'En sede'}"`,
      `"${v.estado === 'DENTRO' ? 'En Planta' : 'Finalizada'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `control_visitantes_recuperaciones_naranjo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-orange-600" />
            <span>Control de Acceso de Visitantes y Contratistas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro ágil de entradas y salidas de visitantes, proveedores, contratistas y personal externo a la empresa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportVisitantesCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Descargar libro de visitas en formato CSV (Excel)"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Descargar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Imprimir planilla de visitas del día"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Planilla</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Visitante</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Visitas del Día</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalHoy}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total registros hoy</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Actualmente en Planta</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.activosDentro}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Personal externo activo</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Salidas Procesadas</span>
            <LogOut className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{metrics.salidasRegistradas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Visitas culminadas</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Contratistas / Técnicos</span>
            <HardHat className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{metrics.contratistas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Con ARL certificada</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, empresa o anfitrión..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({visitantes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DENTRO')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'DENTRO' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Dentro ({metrics.activosDentro})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SALIO')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'SALIO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Salieron ({metrics.salidasRegistradas})
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="VISITANTE">Visitante General</option>
            <option value="CONTRATISTA">Contratista</option>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="AUDITOR">Auditoría / SST</option>
          </select>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Gafete / Pase</th>
                <th className="py-3 px-4">Visitante & Cédula</th>
                <th className="py-3 px-4">Empresa / Procedencia</th>
                <th className="py-3 px-4">Anfitrión & Motivo</th>
                <th className="py-3 px-4">Modalidad</th>
                <th className="py-3 px-4">Ingreso</th>
                <th className="py-3 px-4">Salida</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron visitantes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const entryMin = timeToMinutes(v.hora_ingreso);
                  const isOverstay = v.estado === 'DENTRO' && (currentMinutes - entryMin) > 240;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Gafete */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {v.gafete_asignado}
                        </span>
                      </td>

                      {/* Visitante */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.nombre_completo}</div>
                        <div className="text-[11px] text-slate-500 font-mono">CC {v.documento}</div>
                        {v.tipo_persona && (
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold mt-0.5 ${
                            v.tipo_persona === 'CONTRATISTA' ? 'bg-amber-100 text-amber-800' :
                            v.tipo_persona === 'PROVEEDOR' ? 'bg-blue-100 text-blue-800' :
                            v.tipo_persona === 'AUDITOR' ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {v.tipo_persona}
                          </span>
                        )}
                      </td>

                      {/* Empresa & Equipos */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{v.empresa_origen}</span>
                        </div>
                        {v.equipos_ingresados && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-0.5 font-medium">
                            <Laptop className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[150px]" title={v.equipos_ingresados}>
                              {v.equipos_ingresados}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Anfitrión & Motivo */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{v.anfitrion_visitado}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{v.motivo_visita}</div>
                      </td>

                      {/* Modalidad Acceso */}
                      <td className="py-3 px-4">
                        {v.placa_vehiculo && v.placa_vehiculo !== 'Peatonal' ? (
                          <div className="flex items-center gap-1 text-slate-800">
                            <Car className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-mono font-bold text-[11px]">{v.placa_vehiculo}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Footprints className="w-3.5 h-3.5 text-slate-400" />
                            <span>Peatonal</span>
                          </div>
                        )}
                      </td>

                      {/* Ingreso */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{v.hora_ingreso}</div>
                        <div className="text-[10px] text-slate-400">{v.fecha}</div>
                      </td>

                      {/* Salida */}
                      <td className="py-3 px-4">
                        {v.hora_salida ? (
                          <div className="font-mono font-bold text-blue-700">{v.hora_salida}</div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-semibold italic">En curso</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {v.estado === 'DENTRO' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>En Planta</span>
                            </span>
                            {isOverstay && (
                              <span className="block text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⏱️ &gt;4h en sede
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                            <span>Finalizada</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPass(v)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                          title="Ver e imprimir pase de visitante"
                        >
                          Pase
                        </button>

                        {v.estado === 'DENTRO' && (
                          <button
                            type="button"
                            onClick={() => handleMarkExitPrompt(v)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                            title="Registrar salida del visitante en este momento"
                          >
                            Marcar Salida
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Check-In Form for New Visitor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm">Registrar Ingreso de Visitante / Contratista</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Classification */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Ingreso:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'VISITANTE', label: 'Visitante' },
                    { id: 'CONTRATISTA', label: 'Contratista' },
                    { id: 'PROVEEDOR', label: 'Proveedor' },
                    { id: 'AUDITOR', label: 'Auditoría SST' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_persona: item.id as any })}
                      className={`p-1.5 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        form.tipo_persona === item.id
                          ? 'bg-orange-50 border-orange-500 text-orange-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo: *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro Morales Gutiérrez"
                  value={form.nombre_completo}
                  onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Cédula / Doc: *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 73198004"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa / Procedencia: *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Contratista / Suministros S.A.S."
                    value={form.empresa_origen}
                    onChange={(e) => setForm({ ...form, empresa_origen: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Contacto:</label>
                  <input
                    type="tel"
                    placeholder="Ej: 310 123 4567"
                    value={form.telefono_contacto}
                    onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ARL Afiliada:</label>
                  <select
                    value={form.arl_empresa}
                    onChange={(e) => setForm({ ...form, arl_empresa: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="SURA Seguros">SURA Seguros</option>
                    <option value="Positiva Compañía de Seguros">Positiva Compañía de Seguros</option>
                    <option value="Seguros Bolívar">Seguros Bolívar</option>
                    <option value="Colmena Seguros">Colmena Seguros</option>
                    <option value="AXA Colpatria">AXA Colpatria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Persona a Quien Visita (Anfitrión): *</label>
                <select
                  value={form.anfitrion_visitado}
                  onChange={(e) => setForm({ ...form, anfitrion_visitado: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Administración General">Administración General / Gerencia</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.nombre_completo}>
                      {t.nombre_completo} ({t.cargo} - {t.departamento})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo de la Visita:</label>
                <select
                  value={form.motivo_visita}
                  onChange={(e) => setForm({ ...form, motivo_visita: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Reunión de coordinación técnica">Reunión de coordinación técnica</option>
                  <option value="Entrega de correspondencia / suministros">Entrega de correspondencia / suministros</option>
                  <option value="Mantenimiento de infraestructura o equipos">Mantenimiento de infraestructura o equipos</option>
                  <option value="Auditoría externa o inspección legal">Auditoría externa o inspección legal</option>
                  <option value="Entrevista de selección de personal">Entrevista de selección de personal</option>
                  <option value="Visita de proveedor comercial">Visita de proveedor comercial</option>
                  <option value="Gestión administrativa y pagos">Gestión administrativa y pagos</option>
                </select>
              </div>

              {/* Equipment Declaration */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span>Declaración de Equipos o Herramientas Ingresadas (Opcional):</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Portátil Dell Serial CN-8812, Caja de herramientas"
                  value={form.equipos_ingresados}
                  onChange={(e) => setForm({ ...form, equipos_ingresados: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Acceso:</label>
                  <select
                    value={form.tipo_acceso}
                    onChange={(e) => setForm({ ...form, tipo_acceso: e.target.value as 'PEATONAL' | 'VEHICULAR' })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="PEATONAL">Peatonal (A pie)</option>
                    <option value="VEHICULAR">Vehicular (Carro / Moto)</option>
                  </select>
                </div>
                {form.tipo_acceso === 'VEHICULAR' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Placa del Vehículo:</label>
                    <input
                      type="text"
                      placeholder="Ej: SZK-314"
                      value={form.placa_vehiculo}
                      onChange={(e) => setForm({ ...form, placa_vehiculo: e.target.value.toUpperCase() })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold uppercase"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gafete / Pase Asignado:</label>
                    <input
                      type="text"
                      value={form.gafete_asignado}
                      onChange={(e) => setForm({ ...form, gafete_asignado: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ind-sst-vis"
                  checked={form.induccion_sst}
                  onChange={(e) => setForm({ ...form, induccion_sst: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="ind-sst-vis" className="font-semibold text-slate-700 cursor-pointer text-xs">
                  Inducción de seguridad e ingreso autorizado por vigilancia
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Autorizar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Exit Equipment Inspection Confirmation */}
      {exitInspectionVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Inspección de Salida de Activos</h3>
              </div>
              <button
                type="button"
                onClick={() => setExitInspectionVisitor(null)}
                className="text-amber-100 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 block text-sm">
                  {exitInspectionVisitor.nombre_completo}
                </span>
                <span className="text-slate-500 font-mono">
                  CC {exitInspectionVisitor.documento} · {exitInspectionVisitor.empresa_origen}
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-900 block">
                  Equipos declarados al momento de ingresar:
                </span>
                <p className="text-amber-800 font-medium font-mono">
                  {exitInspectionVisitor.equipos_ingresados}
                </p>
              </div>

              <p className="text-slate-600">
                Por favor confirme que el oficial de garita inspeccionó visualmente los artículos que retira el visitante y verificó que corresponden únicamente a sus pertenencias autorizadas.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExitInspectionVisitor(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmExitWithInspection}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Inspección Conforme · Aprobar Salida</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pase / Gafete Oficial de Visitante */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Pase Oficial de Visitante</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPass(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-center space-y-3">
              <div className="inline-block bg-orange-100 text-orange-700 font-mono font-black text-lg px-4 py-1 rounded-lg border border-orange-200">
                {selectedPass.gafete_asignado}
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">{selectedPass.nombre_completo}</h4>
                <p className="text-xs text-slate-500 font-mono">CC {selectedPass.documento}</p>
                <p className="text-xs font-semibold text-orange-600 mt-0.5">{selectedPass.empresa_origen}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Anfitrión:</span>
                  <span className="font-semibold text-slate-900">{selectedPass.anfitrion_visitado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Motivo:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">{selectedPass.motivo_visita}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedPass.fecha} {selectedPass.hora_ingreso}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehículo / Placa:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedPass.placa_vehiculo || 'Peatonal'}</span>
                </div>
                {selectedPass.equipos_ingresados && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Equipos:</span>
                    <span className="font-semibold text-amber-700 truncate max-w-[170px]">{selectedPass.equipos_ingresados}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado:</span>
                  <span className={`font-bold font-mono ${selectedPass.estado === 'DENTRO' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {selectedPass.estado === 'DENTRO' ? 'EN PLANTA' : 'SALIO'}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                Portar este gafete en un lugar visible en todo momento. Devolverlo en portería al retirarse.
              </p>

              <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Gafete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
