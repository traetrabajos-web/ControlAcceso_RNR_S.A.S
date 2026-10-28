import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  X,
  ShieldCheck,
  Building2,
  User,
  CreditCard,
  Briefcase,
  Laptop,
  Car,
  Footprints,
  AlertCircle,
  QrCode,
  Printer,
  CheckCircle2,
  HardHat
} from 'lucide-react';
import { Trabajador } from '../../types';

interface VisitorSelfRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visitorName: string, badgeCode: string) => void;
}

export const VisitorSelfRegisterModal: React.FC<VisitorSelfRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { trabajadores, addVisitante, visitantes, zonas } = useApp();

  const [tipoPersona, setTipoPersona] = useState<'VISITANTE' | 'CONTRATISTA' | 'PROVEEDOR' | 'AUDITOR'>('VISITANTE');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresaOrigen, setEmpresaOrigen] = useState('');
  const [anfitrion, setAnfitrion] = useState(trabajadores.length > 0 ? trabajadores[0].nombre_completo : 'Administración General');
  const [motivo, setMotivo] = useState('Reunión comercial y técnica');
  const [tipoAcceso, setTipoAcceso] = useState<'PEATONAL' | 'VEHICULAR'>('PEATONAL');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [equipos, setEquipos] = useState('');
  const [arlEmpresa, setArlEmpresa] = useState('SURA Seguros');
  const [aceptaSST, setAceptaSST] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success view with digital pass
  const [createdPass, setCreatedPass] = useState<{
    codigo: string;
    gafete: string;
    nombre: string;
    empresa: string;
    hora: string;
    anfitrion: string;
  } | null>(null);

  if (!isOpen) return null;

  const nextGafete = `VIS-${String(visitantes.length + 1).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreCompleto.trim()) {
      setErrorMsg('Por favor ingrese su nombre y apellido completo.');
      return;
    }
    if (!documento.trim()) {
      setErrorMsg('Por favor ingrese su número de documento o cédula.');
      return;
    }
    if (!empresaOrigen.trim()) {
      setErrorMsg('Por favor indique su empresa u organización de procedencia.');
      return;
    }
    if (!aceptaSST) {
      setErrorMsg('Es indispensable aceptar las normas de seguridad industrial y SST para ingresar.');
      return;
    }

    const placaFinal = tipoAcceso === 'VEHICULAR' ? (placaVehiculo.trim().toUpperCase() || 'VEH-S/P') : 'Peatonal';
    const targetZona = zonas[0] || { id: 1, nombre: 'Portería Principal y Recepción' };

    addVisitante({
      nombre_completo: nombreCompleto.trim(),
      documento: documento.trim(),
      tipo_persona: tipoPersona,
      empresa_origen: empresaOrigen.trim(),
      placa_vehiculo: placaFinal,
      motivo_visita: motivo.trim(),
      anfitrion_visitado: anfitrion,
      gafete_asignado: nextGafete,
      zona_id: targetZona.id,
      zona_nombre: targetZona.nombre,
      induccion_sst: aceptaSST,
      arl_empresa: arlEmpresa,
      arl_vigente: true,
      equipos_ingresados: equipos.trim() || undefined,
      telefono_contacto: telefono.trim() || undefined
    });

    const nowTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    setCreatedPass({
      codigo: `VIS-${String(visitantes.length + 1).padStart(3, '0')}`,
      gafete: nextGafete,
      nombre: nombreCompleto.trim(),
      empresa: empresaOrigen.trim(),
      hora: nowTime,
      anfitrion
    });

    onSuccess(nombreCompleto.trim(), nextGafete);
  };

  const handleResetAndClose = () => {
    setCreatedPass(null);
    setNombreCompleto('');
    setDocumento('');
    setTelefono('');
    setEmpresaOrigen('');
    setPlacaVehiculo('');
    setEquipos('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                {createdPass ? 'Pase de Acceso Autorizado' : 'Registro de Visitantes y Contratistas'}
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                Terminal de Autogestión · Garita Principal Cartagena
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {createdPass ? (
          /* PASS TICKET VIEW */
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                Ingreso Autorizado · Molinete Habilitado
              </span>
              <h3 className="text-xl font-black text-slate-900">
                ¡Bienvenido(a), {createdPass.nombre}!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Su acceso ha sido registrado en el sistema. Por favor reclame su escarapela física con el oficial de guardia si es requerido.
              </p>
            </div>

            {/* Digital Badge Card */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 max-w-md mx-auto text-left relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Escarapela Asignada</span>
                  <span className="text-2xl font-black text-orange-600 font-mono tracking-tight">{createdPass.gafete}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hora Ingreso</span>
                  <span className="text-sm font-black text-slate-800 font-mono">{createdPass.hora}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Empresa</span>
                  <span className="font-bold text-slate-800 truncate block">{createdPass.empresa}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Anfitrión / Recibe</span>
                  <span className="font-bold text-slate-800 truncate block">{createdPass.anfitrion}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <QrCode className="w-8 h-8 text-slate-700" />
                  <span className="text-[10px] font-mono text-slate-500">{createdPass.codigo}</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded font-semibold">
                  RNR S.A.S. — Mamonal
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Comprobante</span>
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-colors"
              >
                Listo / Pasar al Molinete
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Classification Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Tipo de Persona / Motivo de Acceso:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'VISITANTE', label: 'Visitante Comercial', desc: 'Reunión o cliente' },
                  { id: 'CONTRATISTA', label: 'Contratista Técnico', desc: 'Obras o servicio' },
                  { id: 'PROVEEDOR', label: 'Proveedor Insumos', desc: 'Entregas' },
                  { id: 'AUDITOR', label: 'Auditoría / SST', desc: 'Inspección' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipoPersona(item.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tipoPersona === item.id
                        ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-xs ring-1 ring-orange-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">{item.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={e => setNombreCompleto(e.target.value)}
                    placeholder="Ej: Juan Carlos Pérez"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Cédula / CC <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={documento}
                    onChange={e => setDocumento(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ej: 73198004"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Empresa o Entidad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={empresaOrigen}
                    onChange={e => setEmpresaOrigen(e.target.value)}
                    placeholder="Ej: Logística del Caribe S.A.S."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej: 310 123 4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Visit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Persona a Visitar (Anfitrión):
                </label>
                <select
                  value={anfitrion}
                  onChange={e => setAnfitrion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                >
                  <option value="Administración General">Administración General / Gerencia</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.nombre_completo}>
                      {t.nombre_completo} — {t.departamento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Visita:
                </label>
                <select
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
                >
                  <option value="Reunión comercial y técnica">Reunión comercial y técnica</option>
                  <option value="Entrega de insumos y suministros">Entrega de insumos y suministros</option>
                  <option value="Mantenimiento preventivo / correctivo">Mantenimiento preventivo / correctivo</option>
                  <option value="Auditoría documental / SST">Auditoría documental / SST</option>
                  <option value="Entrevista de selección laboral">Entrevista de selección laboral</option>
                  <option value="Trámite administrativo general">Trámite administrativo general</option>
                </select>
              </div>
            </div>

            {/* Access Mode: Pedestrian vs Vehicle */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Modalidad de Ingreso:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAcceso('PEATONAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      tipoAcceso === 'PEATONAL'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Peatonal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAcceso('VEHICULAR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      tipoAcceso === 'VEHICULAR'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Con Vehículo</span>
                  </button>
                </div>
              </div>

              {tipoAcceso === 'VEHICULAR' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Placa del Vehículo / Moto:
                  </label>
                  <input
                    type="text"
                    value={placaVehiculo}
                    onChange={e => setPlacaVehiculo(e.target.value.toUpperCase())}
                    placeholder="Ej: SZK-314 o TPK-89D"
                    maxLength={10}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 tracking-wider focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Asset / Equipment Pass Declaration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-slate-500" />
                <span>Declaración de Equipos o Herramientas Ingresadas (Opcional):</span>
              </label>
              <input
                type="text"
                value={equipos}
                onChange={e => setEquipos(e.target.value)}
                placeholder="Ej: Portátil Dell Latitude serial CN-0821, Maletín de herramientas"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Registre computadores o equipos de valor para facilitar su verificación obligatoria al momento de salir de planta.
              </span>
            </div>

            {/* ARL and SST Safety Accord */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <HardHat className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Seguridad Industrial & ARL de Riesgo:</span>
                  <span>
                    El ingreso a planta requiere acatar las normas de seguridad de RNR S.A.S. y portar elementos de protección si ingresa al área operativa.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-amber-800 mb-0.5">ARL Afiliada:</label>
                  <select
                    value={arlEmpresa}
                    onChange={e => setArlEmpresa(e.target.value)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900"
                  >
                    <option value="SURA Seguros">SURA Seguros</option>
                    <option value="Positiva Compañía de Seguros">Positiva Compañía de Seguros</option>
                    <option value="Seguros Bolívar">Seguros Bolívar</option>
                    <option value="Colmena Seguros">Colmena Seguros</option>
                    <option value="AXA Colpatria">AXA Colpatria</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="sst-chk"
                    checked={aceptaSST}
                    onChange={e => setAceptaSST(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-md border-amber-300 focus:ring-orange-500"
                  />
                  <label htmlFor="sst-chk" className="text-xs font-bold text-amber-950 cursor-pointer">
                    Acepto normas de SST y EPP
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-600/20 flex items-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Registrar Entrada y Abrir Molinete</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
