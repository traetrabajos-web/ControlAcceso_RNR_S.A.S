import { HorarioOficial, RegistroAcceso, Trabajador } from '../types';

export function timeToMinutes(hhmm: string): number {
  if (!hhmm || !hhmm.includes(':')) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDurationMinutes(totalMin: number): string {
  const safeMin = Math.max(1, Math.round(totalMin));
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function getScheduleForDate(horarios: HorarioOficial[], dateObj: Date = new Date()): HorarioOficial {
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes ... 6 = Sábado
  const found = horarios.find(h => Number(h.codigo_dia) === Number(dayOfWeek));
  if (found) return found;
  return {
    dia: dayOfWeek === 1 ? 'Lunes' : (dayOfWeek === 6 ? 'Sábado' : (dayOfWeek === 0 ? 'Domingo' : 'Día Laboral')),
    codigo_dia: dayOfWeek,
    entrada: dayOfWeek === 1 ? '08:00' : '07:30',
    salida: dayOfWeek === 1 ? '16:30' : (dayOfWeek >= 2 && dayOfWeek <= 5 ? '17:00' : '13:00'),
    horas_ordinarias: dayOfWeek === 1 ? 7.0 : (dayOfWeek >= 2 && dayOfWeek <= 5 ? 8.5 : 0),
    aplica_administracion: dayOfWeek >= 1 && dayOfWeek <= 5,
    aplica_patio: true,
    es_jornada_extra: dayOfWeek === 0 || dayOfWeek === 6
  };
}

export function evaluateAttendance(horaEntradaHHMM: string, toleranciaMin = 10, schedule: HorarioOficial): string {
  if (schedule.es_jornada_extra) {
    return 'EXTRAORDINARIA';
  }
  const entradaMin = timeToMinutes(horaEntradaHHMM);
  const scheduledMin = timeToMinutes(schedule.entrada || '07:30');
  const limiteMin = scheduledMin + toleranciaMin;

  if (entradaMin > limiteMin) {
    const diff = entradaMin - scheduledMin;
    return `TARDANZA (${diff}m)`;
  }
  return 'PUNTUAL';
}

export interface Worker42hSummary {
  trabajador: Trabajador;
  diasLaborados: number;
  minutosTotales: number;
  horasTotalesStr: string;
  horasOrdinarias: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  horasDominicalesFestivas: number;
  estadoCumplimiento: 'CUMPLE_42H' | 'EN_CURSO' | 'INCOMPLETO';
}

export function calculateWorkerWeeklySummary(
  trabajador: Trabajador,
  registros: RegistroAcceso[],
  _horarios: HorarioOficial[]
): Worker42hSummary {
  const workerRegs = registros.filter(r => Number(r.trabajador_id) === Number(trabajador.id));
  const diasLaborados = new Set(workerRegs.map(r => r.fecha)).size;
  let minutosTotales = 0;
  let horasExtrasDiurnas = 0;
  let horasExtrasNocturnas = 0;
  let horasDominicalesFestivas = 0;

  for (const reg of workerRegs) {
    let min = 0;
    if (reg.minutos_trabajados !== null) {
      min = reg.minutos_trabajados;
    } else if (reg.hora_entrada) {
      const inMin = timeToMinutes(reg.hora_entrada);
      const nowMin = timeToMinutes(getCurrentTimeHHMM());
      min = Math.max(0, nowMin - inMin);
    }
    minutosTotales += min;

    // Classification of extras
    const hours = min / 60;
    if (reg.estado_asistencia === 'EXTRAORDINARIA') {
      horasDominicalesFestivas += hours;
    } else if (hours > 8.5) {
      horasExtrasDiurnas += (hours - 8.5);
    }
  }

  const horasTotalesNum = minutosTotales / 60;
  const horasOrdinarias = Math.min(42, Math.max(0, horasTotalesNum - horasExtrasDiurnas - horasDominicalesFestivas));

  return {
    trabajador,
    diasLaborados,
    minutosTotales,
    horasTotalesStr: formatDurationMinutes(minutosTotales),
    horasOrdinarias: Number(horasOrdinarias.toFixed(1)),
    horasExtrasDiurnas: Number(horasExtrasDiurnas.toFixed(1)),
    horasExtrasNocturnas: Number(horasExtrasNocturnas.toFixed(1)),
    horasDominicalesFestivas: Number(horasDominicalesFestivas.toFixed(1)),
    estadoCumplimiento: horasTotalesNum >= 42 ? 'CUMPLE_42H' : (horasTotalesNum > 20 ? 'EN_CURSO' : 'INCOMPLETO')
  };
}
