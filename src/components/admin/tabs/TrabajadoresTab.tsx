import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Trabajador, EstadoTrabajador, TipoPersonal } from '../../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  HardHat,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  X,
  Phone,
  Heart,
  FileCheck,
  DollarSign
} from 'lucide-react';

export const TrabajadoresTab: React.FC = () => {
  const { trabajadores, addWorker, updateWorker, deleteWorker, zonas } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [editingWorker, setEditingWorker] = useState<Trabajador | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBadgeWorker, setSelectedBadgeWorker] = useState<Trabajador | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre_completo: '',
    documento: '',
    codigo_credencial: '',
    cargo: '',
    departamento: 'Patio y Operaciones',
    tipo_personal: 'PATIO' as TipoPersonal,
    es_puesto_critico: false,
    telefono: '',
    email: '',
    arl_vigente: true,
    estado: 'ACTIVO' as EstadoTrabajador,
    zonas_autorizadas: [1, 3],
    eps: 'Nueva EPS',
    rh: 'O+',
    contacto_emergencia: '',
    telefono_emergencia: '',
    certificacion_maquinaria: '',
    salario_base_hora: 14000
  });

  const filtered = useMemo(() => {
    return trabajadores.filter(t => {
      const matchSearch =
        t.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.documento.includes(searchTerm) ||
        t.codigo_credencial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cargo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipo = filterTipo === 'TODOS' || t.tipo_personal === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [trabajadores, searchTerm, filterTipo]);

  const handleOpenEdit = (w: Trabajador) => {
    setEditingWorker(w);
    setFormData({
      nombre_completo: w.nombre_completo,
      documento: w.documento,
      codigo_credencial: w.codigo_credencial,
      cargo: w.cargo,
      departamento: w.departamento,
      tipo_personal: w.tipo_personal,
      es_puesto_critico: w.es_puesto_critico,
      telefono: w.telefono,
      email: w.email,
      arl_vigente: w.arl_vigente,
      estado: w.estado,
      zonas_autorizadas: w.zonas_autorizadas,
      eps: w.eps || 'Nueva EPS',
      rh: w.rh || 'O+',
      contacto_emergencia: w.contacto_emergencia || '',
      telefono_emergencia: w.telefono_emergencia || '',
      certificacion_maquinaria: w.certificacion_maquinaria || '',
      salario_base_hora: w.salario_base_hora || 14000
    });
  };

  const handleOpenAdd = () => {
    setEditingWorker(null);
    const nextNum = trabajadores.length + 1;
    setFormData({
      nombre_completo: '',
      documento: '',
      codigo_credencial: `EMP-${String(nextNum).padStart(3, '0')}`,
      cargo: 'Ayudante de Patio y Clasificación',
      departamento: 'Patio y Operaciones',
      tipo_personal: 'PATIO',
      es_puesto_critico: false,
      telefono: '3000000000',
      email: 'empleado@recuperacionesnaranjo.com',
      arl_vigente: true,
      estado: 'ACTIVO',
      zonas_autorizadas: [1, 3],
      eps: 'Nueva EPS',
      rh: 'O+',
      contacto_emergencia: 'Familiar Principal',
      telefono_emergencia: '3001122334',
      certificacion_maquinaria: '',
      salario_base_hora: 12000
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) {
      updateWorker({
        ...editingWorker,
        ...formData
      });
      setEditingWorker(null);
    } else {
      addWorker({
        ...formData,
        cargo_id: 6,
        turno_id: 1,
        ubicacion_actual: 'FUERA_PLANTA',
        ultima_entrada: null
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">👷 Padrón Integral de Trabajadores y SST</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión 360° de personal de planta, maquinaria pesada, certificaciones operativas y carnetización.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Colaborador</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula, credencial, nombre o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Tipo de Personal:</span>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
          >
            <option value="TODOS">Todos ({trabajadores.length})</option>
            <option value="PATIO">Patio & Maquinaria</option>
            <option value="ADMINISTRACION">Administración</option>
            <option value="APRENDIZ_SENA">Aprendiz SENA</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Credencial</th>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Cargo y Área</th>
                <th className="px-4 py-3">Salud / EPS</th>
                <th className="px-4 py-3">ARL</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{t.codigo_credencial}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.nombre_completo}</span>
                      {t.es_puesto_critico && (
                        <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">CC {t.documento} {t.rh && `· RH ${t.rh}`}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-medium text-slate-800 block">{t.cargo}</span>
                    <span className="text-[11px] text-slate-400">{t.departamento}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="block font-medium">{t.eps || 'Sura'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">${(t.salario_base_hora || 14000).toLocaleString('es-CO')}/h</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => updateWorker({ ...t, arl_vigente: !t.arl_vigente })}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        t.arl_vigente ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                      title="Haz clic para alternar vigencia ARL"
                    >
                      {t.arl_vigente ? 'Vigente' : 'Vencida'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => updateWorker({
                        ...t,
                        estado: t.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO'
                      })}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        t.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                      title="Haz clic para alternar estado"
                    >
                      {t.estado}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.ubicacion_actual === 'DENTRO_PLANTA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.ubicacion_actual === 'DENTRO_PLANTA' ? 'EN PLANTA' : 'FUERA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBadgeWorker(t)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                        title="Ver / Imprimir Carnet con QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Editar trabajador"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de desincorporar a ${t.nombre_completo}?`)) {
                            deleteWorker(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar del padrón"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Digital Badge / Carnet QR */}
      {selectedBadgeWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Carnet Digital de Identificación</span>
              <button onClick={() => setSelectedBadgeWorker(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Industrial badge card */}
            <div className="p-6 text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md">
                {selectedBadgeWorker.foto_url ? (
                  <img src={selectedBadgeWorker.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center font-bold text-2xl">
                    {selectedBadgeWorker.nombre_completo.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedBadgeWorker.nombre_completo}</h3>
                <p className="text-xs font-semibold text-orange-600 mt-0.5">{selectedBadgeWorker.cargo}</p>
                <span className="text-xs text-slate-500">{selectedBadgeWorker.departamento}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Credencial:</span>
                  <strong>{selectedBadgeWorker.codigo_credencial}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">C.C.:</span>
                  <span>{selectedBadgeWorker.documento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grupo RH:</span>
                  <span>{selectedBadgeWorker.rh || 'O+'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EPS:</span>
                  <span>{selectedBadgeWorker.eps || 'Nueva EPS'}</span>
                </div>
              </div>

              <div className="w-24 h-24 mx-auto bg-slate-100 p-2 border border-slate-300 rounded-xl flex flex-col items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="text-[8px] font-mono text-slate-500">{selectedBadgeWorker.codigo_credencial}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Carnet</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBadgeWorker(null)}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Worker */}
      {(isAddModalOpen || editingWorker) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingWorker ? 'Editar Ficha 360° del Trabajador' : 'Registrar Nuevo Colaborador'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre_completo}
                    onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cédula de Ciudadanía:</label>
                  <input
                    type="text"
                    required
                    value={formData.documento}
                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Credencial:</label>
                  <input
                    type="text"
                    required
                    value={formData.codigo_credencial}
                    onChange={e => setFormData({ ...formData, codigo_credencial: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo:</label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departamento:</label>
                  <select
                    value={formData.departamento}
                    onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Patio y Operaciones">Patio y Operaciones</option>
                    <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Oxicorte y Desguace">Oxicorte y Desguace</option>
                    <option value="Seguridad y Pesaje">Seguridad y Pesaje</option>
                    <option value="Administración y Finanzas">Administración y Finanzas</option>
                    <option value="Talento Humano / SENA">Talento Humano / SENA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Personal:</label>
                  <select
                    value={formData.tipo_personal}
                    onChange={e => setFormData({ ...formData, tipo_personal: e.target.value as TipoPersonal })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="PATIO">PATIO (Operaciones)</option>
                    <option value="ADMINISTRACION">ADMINISTRACIÓN</option>
                    <option value="APRENDIZ_SENA">APRENDIZ SENA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">EPS:</label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={e => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grupo RH:</label>
                  <input
                    type="text"
                    value={formData.rh}
                    onChange={e => setFormData({ ...formData, rh: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salario Hora (COP):</label>
                  <input
                    type="number"
                    value={formData.salario_base_hora}
                    onChange={e => setFormData({ ...formData, salario_base_hora: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Licencia / Certificación Maquinaria (Si aplica):</label>
                <input
                  type="text"
                  placeholder="Ej: Licencia SENA Grúa Pulpo Liebherr / Puente Grúa"
                  value={formData.certificacion_maquinaria}
                  onChange={e => setFormData({ ...formData, certificacion_maquinaria: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contacto de Emergencia:</label>
                  <input
                    type="text"
                    placeholder="Nombre del familiar"
                    value={formData.contacto_emergencia}
                    onChange={e => setFormData({ ...formData, contacto_emergencia: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Emergencia:</label>
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    value={formData.telefono_emergencia}
                    onChange={e => setFormData({ ...formData, telefono_emergencia: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado en Padrón:</label>
                  <select
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value as EstadoTrabajador })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                    <option value="VACACIONES">VACACIONES</option>
                    <option value="RETIRADO">RETIRADO</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.arl_vigente}
                      onChange={e => setFormData({ ...formData, arl_vigente: e.target.checked })}
                      className="rounded text-orange-600"
                    />
                    <span className="font-semibold text-slate-700">ARL Vigente</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.es_puesto_critico}
                      onChange={e => setFormData({ ...formData, es_puesto_critico: e.target.checked })}
                      className="rounded text-orange-600"
                    />
                    <span className="font-semibold text-slate-700">Puesto Crítico</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWorker(null);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {editingWorker ? 'Guardar Cambios' : 'Registrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
