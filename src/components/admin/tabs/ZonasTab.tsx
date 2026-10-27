import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { DoorClosed, Calendar, Clock, ShieldCheck, AlertOctagon, MapPin, Users, Info, Compass, Layers } from 'lucide-react';

export const ZonasTab: React.FC = () => {
  const { zonas, horarios, trabajadores, visitantes, empresaConfig, toggleEmergencyLockdown } = useApp();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const enPlanta = trabajadores.filter(t => t.ubicacion_actual === 'DENTRO_PLANTA');
  const visitantesDentro = visitantes.filter(v => v.estado === 'DENTRO');

  // Calculate dynamic occupancy per zone
  const getZoneOccupancy = (zoneId: number) => {
    switch (zoneId) {
      case 1:
        return enPlanta.length; // Portería & Kiosco total throughput
      case 2:
        return visitantesDentro.length; // Báscula Camionera
      case 3:
        return enPlanta.filter(t => t.tipo_personal === 'PATIO').length; // Patio de Chatarra
      case 4:
        return enPlanta.filter(t => t.cargo.includes('Mecánico') || t.cargo.includes('Oxicorte')).length; // Taller
      case 5:
        return enPlanta.filter(t => t.tipo_personal === 'ADMINISTRACION').length; // Edificio Admin
      default:
        return 0;
    }
  };

  const selectedZone = zonas.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🏢 Zonificación Perimetral, Plano de Planta y Horarios 42h</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geometría física de la sede industrial Mamonal Km 7, aforos en tiempo real y régimen semanal Ley 2101 / CST.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleEmergencyLockdown}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ${
            empresaConfig.modo_bloqueo_emergencia
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-orange-400" />
          <span>{empresaConfig.modo_bloqueo_emergencia ? 'Desactivar Bloqueo Perimetral' : 'Simular Bloqueo de Emergencia'}</span>
        </button>
      </div>

      {/* 2D Architectural Plant Map (Sede Mamonal Km 7, Cartagena) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-slate-900 text-xs">
              Plano Esquemático de Planta · Sede Industrial Mamonal Km 7 (Cartagena)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Zona Segura / Operativa
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Zona de Riesgo V
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Evacuación / Bloqueo
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-900 relative overflow-x-auto">
          {/* SVG Map Layout */}
          <div className="min-w-[680px] max-w-[900px] mx-auto">
            <svg viewBox="0 0 900 480" className="w-full h-auto select-none font-sans">
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="900" height="480" fill="#0f172a" />
              <rect width="900" height="480" fill="url(#grid)" />

              {/* Road / Mamonal Highway at the left */}
              <rect x="0" y="0" width="80" height="480" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <line x1="40" y1="0" x2="40" y2="480" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10,10" />
              <text x="35" y="240" fill="#94a3b8" fontSize="10" fontWeight="bold" transform="rotate(-90 35 240)" textAnchor="middle" letterSpacing="2">
                CORREDOR INDUSTRIAL MAMONAL KM 7
              </text>

              {/* Perimeter Fence Line */}
              <rect x="80" y="15" width="805" height="450" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />
              <text x="90" y="32" fill="#64748b" fontSize="9" fontWeight="bold">CERRAMIENTO PERIMETRAL INDUSTRIAL</text>

              {/* ZONE 1: Porteria & Kiosco de Control (x: 100, y: 160, w: 160, h: 160) */}
              <g
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedZoneId(1)}
              >
                <rect
                  x="100"
                  y="160"
                  width="160"
                  height="160"
                  rx="6"
                  fill={selectedZoneId === 1 ? '#334155' : '#1e293b'}
                  stroke={empresaConfig.modo_bloqueo_emergencia ? '#f43f5e' : selectedZoneId === 1 ? '#f97316' : '#38bdf8'}
                  strokeWidth={selectedZoneId === 1 ? '3' : '2'}
                />
                <circle cx="125" cy="185" r="10" fill="#0284c7" />
                <text x="125" y="189" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">1</text>
                <text x="145" y="185" fill="#f8fafc" fontSize="11" fontWeight="bold">GARITA PRINCIPAL</text>
                <text x="145" y="198" fill="#94a3b8" fontSize="9">Kiosco · Control Peatonal</text>

                <rect x="115" y="215" width="130" height="30" rx="4" fill="#0f172a" />
                <text x="125" y="233" fill="#38bdf8" fontSize="10" fontWeight="bold">
                  👥 {getZoneOccupancy(1)} personas
                </text>

                <text x="115" y="270" fill="#64748b" fontSize="8">Molinete RFID / Biometría</text>
                <text x="115" y="285" fill="#e2e8f0" fontSize="9" fontWeight="bold">Aforo Máx: 20</text>
                <circle cx="240" cy="185" r="4" fill={empresaConfig.modo_bloqueo_emergencia ? '#ef4444' : '#10b981'} className="animate-ping" />
              </g>

              {/* ZONE 2: Báscula Camionera Metrológica (x: 100, y: 340, w: 220, h: 100) */}
              <g
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedZoneId(2)}
              >
                <rect
                  x="100"
                  y="340"
                  width="220"
                  height="100"
                  rx="6"
                  fill={selectedZoneId === 2 ? '#334155' : '#1e293b'}
                  stroke={empresaConfig.modo_bloqueo_emergencia ? '#f43f5e' : selectedZoneId === 2 ? '#f97316' : '#eab308'}
                  strokeWidth={selectedZoneId === 2 ? '3' : '2'}
                />
                <circle cx="125" cy="365" r="10" fill="#d97706" />
                <text x="125" y="369" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">2</text>
                <text x="145" y="365" fill="#f8fafc" fontSize="11" fontWeight="bold">BÁSCULA CAMIONERA</text>
                <text x="145" y="378" fill="#94a3b8" fontSize="9">Pesaje 80 Ton · Camiones Carga</text>

                <rect x="115" y="390" width="190" height="35" rx="4" fill="#0f172a" />
                <text x="125" y="407" fill="#fbbf24" fontSize="10" fontWeight="bold">
                  🚛 {getZoneOccupancy(2)} camiones pesando
                </text>
                <text x="125" y="420" fill="#94a3b8" fontSize="8">
                  Tolva de pesado y tara metrológica
                </text>
              </g>

              {/* ZONE 5: Edificio Administrativo y SST (x: 100, y: 35, w: 220, h: 105) */}
              <g
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedZoneId(5)}
              >
                <rect
                  x="100"
                  y="35"
                  width="220"
                  height="105"
                  rx="6"
                  fill={selectedZoneId === 5 ? '#334155' : '#1e293b'}
                  stroke={empresaConfig.modo_bloqueo_emergencia ? '#f43f5e' : selectedZoneId === 5 ? '#f97316' : '#10b981'}
                  strokeWidth={selectedZoneId === 5 ? '3' : '2'}
                />
                <circle cx="125" cy="60" r="10" fill="#059669" />
                <text x="125" y="64" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">5</text>
                <text x="145" y="60" fill="#f8fafc" fontSize="11" fontWeight="bold">EDIFICIO ADMINISTRATIVO</text>
                <text x="145" y="73" fill="#94a3b8" fontSize="9">Gerencia · Contabilidad · Oficina SST</text>

                <rect x="115" y="85" width="190" height="38" rx="4" fill="#0f172a" />
                <text x="125" y="102" fill="#34d399" fontSize="10" fontWeight="bold">
                  💼 {getZoneOccupancy(5)} personal administrativo
                </text>
                <text x="125" y="115" fill="#64748b" fontSize="8">Climatizado · Sala de Capacitación</text>
              </g>

              {/* ZONE 3: Patio Principal de Chatarra Ferrosa & No Ferrosa (x: 350, y: 35, w: 320, h: 405) */}
              <g
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedZoneId(3)}
              >
                <rect
                  x="350"
                  y="35"
                  width="320"
                  height="405"
                  rx="8"
                  fill={selectedZoneId === 3 ? '#292524' : '#1c1917'}
                  stroke={empresaConfig.modo_bloqueo_emergencia ? '#f43f5e' : selectedZoneId === 3 ? '#ea580c' : '#f97316'}
                  strokeWidth={selectedZoneId === 3 ? '3.5' : '2'}
                />
                <circle cx="375" cy="65" r="12" fill="#ea580c" />
                <text x="375" y="70" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">3</text>
                <text x="398" y="65" fill="#ffedd5" fontSize="13" fontWeight="black" letterSpacing="0.5">
                  PATIO CENTRAL DE CHATARRA
                </text>
                <text x="398" y="80" fill="#fdba74" fontSize="9">
                  Clasificación Ferrosa, Cizallado y Grúas (Riesgo V)
                </text>

                {/* Sub-areas inside Yard */}
                <rect x="370" y="100" width="280" height="90" rx="4" fill="#292524" stroke="#44403c" strokeWidth="1" strokeDasharray="4,4" />
                <text x="380" y="120" fill="#fed7aa" fontSize="10" fontWeight="bold">🏗️ Bahía Grúa Liebherr LH 40 (Radio 16m)</text>
                <text x="380" y="135" fill="#a8a29e" fontSize="8.5">Carga de Pulpo Hidráulico · Chatarra Pesada Industrial</text>
                <text x="380" y="155" fill="#fb923c" fontSize="9" fontWeight="bold">Horómetro: 4,821.5 h</text>

                <rect x="370" y="205" width="280" height="90" rx="4" fill="#292524" stroke="#44403c" strokeWidth="1" strokeDasharray="4,4" />
                <text x="380" y="225" fill="#fed7aa" fontSize="10" fontWeight="bold">🏗️ Bahía Grúa Fuchs MHL 350 (Radio 15m)</text>
                <text x="380" y="240" fill="#a8a29e" fontSize="8.5">Clasificación de Chatarra Estructural y Tolete</text>
                <text x="380" y="260" fill="#fb923c" fontSize="9" fontWeight="bold">Horómetro: 3,412.0 h</text>

                <rect x="370" y="310" width="280" height="110" rx="4" fill="#0f172a" />
                <text x="380" y="332" fill="#fb923c" fontSize="12" fontWeight="black">
                  🦺 Cuadrilla en Patio: {getZoneOccupancy(3)} Operarios
                </text>
                <text x="380" y="352" fill="#e2e8f0" fontSize="9">EPP Obligatorio: Casco con Barbuquejo, Gafas, Botas Dieléctricas</text>
                <text x="380" y="370" fill="#94a3b8" fontSize="8.5">Jefe de Patio a cargo: Carlos Mario Mendoza (Radio Ch. 4)</text>
                <text x="380" y="395" fill="#38bdf8" fontSize="9" fontWeight="bold">Montacargas Yale 7T en tránsito activo</text>
              </g>

              {/* ZONE 4: Taller Mecanico y Oxicorte (x: 695, y: 35, w: 175, h: 220) */}
              <g
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedZoneId(4)}
              >
                <rect
                  x="695"
                  y="35"
                  width="175"
                  height="220"
                  rx="6"
                  fill={selectedZoneId === 4 ? '#334155' : '#1e293b'}
                  stroke={empresaConfig.modo_bloqueo_emergencia ? '#f43f5e' : selectedZoneId === 4 ? '#f97316' : '#a855f7'}
                  strokeWidth={selectedZoneId === 4 ? '3' : '2'}
                />
                <circle cx="720" cy="60" r="10" fill="#9333ea" />
                <text x="720" y="64" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">4</text>
                <text x="740" y="60" fill="#f8fafc" fontSize="11" fontWeight="bold">TALLER & OXICORTE</text>
                <text x="740" y="73" fill="#94a3b8" fontSize="9">Corte en Caliente y Mecánica</text>

                <rect x="705" y="88" width="155" height="42" rx="4" fill="#0f172a" />
                <text x="715" y="105" fill="#c084fc" fontSize="10" fontWeight="bold">
                  🔥 {getZoneOccupancy(4)} operarios corte
                </text>
                <text x="715" y="118" fill="#94a3b8" fontSize="8">Permiso de Trabajo en Caliente</text>

                <text x="705" y="150" fill="#64748b" fontSize="8.5">Banco de Cilindros Oxígeno</text>
                <text x="705" y="165" fill="#64748b" fontSize="8.5">Extintores PQS 20 lbs al día</text>
                <text x="705" y="185" fill="#f1f5f9" fontSize="9" fontWeight="bold">Aforo Máx: 10</text>
              </g>

              {/* PUNTO DE ENCUENTRO / EVACUACIÓN (x: 695, y: 280, w: 175, h: 160) */}
              <g>
                <rect
                  x="695"
                  y="280"
                  width="175"
                  height="160"
                  rx="6"
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <circle cx="782" cy="325" r="24" fill="#10b981" />
                <text x="782" y="332" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">⛑️</text>
                <text x="782" y="370" fill="#ecfdf5" fontSize="11" fontWeight="black" textAnchor="middle">
                  PUNTO DE ENCUENTRO
                </text>
                <text x="782" y="388" fill="#a7f3d0" fontSize="9" textAnchor="middle">
                  Zona Segura de Evacuación SST
                </text>
                <text x="782" y="415" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  Libre de cargas suspendidas
                </text>
              </g>

              {/* Emergency Lockdown Visual Banner if Active */}
              {empresaConfig.modo_bloqueo_emergencia && (
                <g>
                  <rect x="80" y="210" width="805" height="60" fill="#be123c" opacity="0.9" />
                  <text x="480" y="245" fill="#ffffff" fontSize="16" fontWeight="black" textAnchor="middle" letterSpacing="2">
                    ⚠️ ALERTA SST: EVACUACIÓN ACTIVA · TODOS LOS MOLINETES DESBLOQUEADOS EN MODO ESCAPE
                  </text>
                </g>
              )}
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Haz clic en cualquiera de las 5 zonas para visualizar detalles operativos, nivel de riesgo SST y aforo asignado.
          </p>
        </div>
      </div>

      {/* Selected Zone Quick Inspector */}
      {selectedZone && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-orange-600 text-white font-mono font-black flex items-center justify-center text-sm shrink-0">
              {selectedZone.codigo}
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedZone.nombre}</h4>
              <p className="text-xs text-slate-600">
                {selectedZone.ubicacion} · Nivel de Riesgo SST: <strong className="text-orange-900">{selectedZone.nivel_seguridad}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <span>Aforo Máximo: <strong>{selectedZone.aforo_maximo}</strong></span>
            <span>Ocupación Actual: <strong className="text-orange-700">{getZoneOccupancy(selectedZone.id)}</strong></span>
            <button
              onClick={() => setSelectedZoneId(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Interactive Facility Gates & Zones Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <DoorClosed className="w-4 h-4 text-orange-600" />
          <span>Fichas de Puntos de Control y Aforos Máximos</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonas.map(z => {
            const ocupacion = getZoneOccupancy(z.id);
            const aforoPct = Math.min(100, Math.round((ocupacion / z.aforo_maximo) * 100));

            return (
              <div
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                className={`p-5 bg-white rounded-xl border transition-all cursor-pointer shadow-xs space-y-3 ${
                  selectedZoneId === z.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {z.codigo}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    empresaConfig.modo_bloqueo_emergencia
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {empresaConfig.modo_bloqueo_emergencia ? 'BLOQUEADA' : z.estado}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{z.nombre}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{z.ubicacion}</span>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Presencia estimada:
                    </span>
                    <span>{ocupacion} / {z.aforo_maximo} ({aforoPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        aforoPct > 80 ? 'bg-rose-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${aforoPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Seguridad: <strong className="text-slate-800">{z.nivel_seguridad}</strong></span>
                  <span>Tipo: <strong className="text-slate-800">{z.tipo}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official 42-Hour Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Tabla Oficial de Horarios Laborales (Jornada Semanal 42 Horas — Ley 2101)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full">
            Total Lunes a Viernes: 42.0 Horas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Día de la Semana</th>
                <th className="px-4 py-3">Hora de Entrada</th>
                <th className="px-4 py-3">Receso de Almuerzo</th>
                <th className="px-4 py-3">Hora de Salida</th>
                <th className="px-4 py-3 text-right">Horas Ordinarias</th>
                <th className="px-4 py-3">Cobertura de Personal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {horarios.map(h => (
                <tr key={h.dia} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{h.dia}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">{h.entrada}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {h.inicio_almuerzo && h.fin_almuerzo
                      ? `${h.inicio_almuerzo} – ${h.fin_almuerzo} (${h.duracion_almuerzo_min} min)`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">{h.salida}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {h.horas_ordinarias > 0 ? `${h.horas_ordinarias} h` : '0.0 h (Extras)'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.es_jornada_extra
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {h.es_jornada_extra ? 'Solo Cuadrilla de Patio Autorizada' : 'Administración y Patio'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
