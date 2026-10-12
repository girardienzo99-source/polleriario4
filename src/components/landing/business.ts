/**
 * Datos públicos del local y horarios de atención (zona horaria de Córdoba).
 * Fuente única para la landing: header, hero, info, checkout y footer.
 */

export const BUSINESS = {
  name: 'Pollería Los Campeones',
  shortName: 'Los Campeones',
  address: 'Av. Marcelo T. de Alvear 840',
  city: 'Río Cuarto, Córdoba',
  whatsapp: '5493585123456',
  whatsappDisplay: '+54 9 358 512-3456',
  mapsEmbed:
    'https://www.google.com/maps?q=Av.+Marcelo+T.+de+Alvear+840,+R%C3%ADo+Cuarto,+C%C3%B3rdoba&output=embed',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Av.+Marcelo+T.+de+Alvear+840,+R%C3%ADo+Cuarto,+C%C3%B3rdoba',
} as const;

export const TIME_ZONE = 'America/Argentina/Cordoba';

/** Franjas en minutos desde la medianoche. */
export interface TimeRange {
  open: string; // HH:MM
  close: string; // HH:MM
}

/** Índice 0 = domingo … 6 = sábado. */
export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

const SERVICE: TimeRange[] = [
  { open: '11:00', close: '15:00' },
  { open: '19:30', close: '23:30' },
];

/** Horario semanal (Lun–Dom 11:00–15:00 y 19:30–23:30). */
export const BUSINESS_HOURS: Record<number, TimeRange[]> = {
  0: SERVICE,
  1: SERVICE,
  2: SERVICE,
  3: SERVICE,
  4: SERVICE,
  5: SERVICE,
  6: SERVICE,
};

/** Orden de visualización: lunes primero. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Día de semana y minutos actuales en Córdoba, independiente de la zona del navegador. */
export function nowInCordoba(date: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  return { day: day < 0 ? 0 : day, minutes };
}

export interface OpenStatus {
  isOpen: boolean;
  /** Texto corto, ej. "Abierto · cierra 15:00" o "Cerrado · abre hoy 19:30". */
  label: string;
}

export function getOpenStatus(date: Date = new Date()): OpenStatus {
  const { day, minutes } = nowInCordoba(date);
  const today = BUSINESS_HOURS[day] ?? [];
  const current = today.find(r => minutes >= toMin(r.open) && minutes < toMin(r.close));
  if (current) return { isOpen: true, label: `Abierto · cierra ${current.close}` };

  const laterToday = today.find(r => toMin(r.open) > minutes);
  if (laterToday) return { isOpen: false, label: `Cerrado · abre hoy ${laterToday.open}` };

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const first = BUSINESS_HOURS[d]?.[0];
    if (first) {
      const when = i === 1 ? 'mañana' : DAY_NAMES[d].toLowerCase();
      return { isOpen: false, label: `Cerrado · abre ${when} ${first.open}` };
    }
  }
  return { isOpen: false, label: 'Cerrado' };
}

export function formatRanges(ranges: TimeRange[]): string {
  if (!ranges.length) return 'Cerrado';
  return ranges.map(r => `${r.open} – ${r.close}`).join(' y ');
}

export const ASAP = 'Lo antes posible';

/**
 * Horarios programables cada 30 minutos dentro de las franjas de atención.
 * Hoy: desde 45 min a partir de ahora. Si no queda ninguno hoy, ofrece los de mañana.
 */
export function getTimeSlots(date: Date = new Date()): string[] {
  const { day, minutes } = nowInCordoba(date);
  const build = (d: number, from: number, prefix: string) => {
    const slots: string[] = [];
    for (const r of BUSINESS_HOURS[d] ?? []) {
      const start = Math.max(toMin(r.open) + 30, Math.ceil(from / 30) * 30);
      for (let t = start; t < toMin(r.close); t += 30) slots.push(`${prefix} ${toHHMM(t)}`);
    }
    return slots;
  };
  const today = build(day, minutes + 45, 'Hoy');
  if (today.length) return today;
  return build((day + 1) % 7, 0, 'Mañana');
}

export function whatsappLink(message?: string): string {
  return message ? `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}` : `https://wa.me/${BUSINESS.whatsapp}`;
}
