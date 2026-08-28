export type LocalDateTimeParts = { date: string; time: string };

const pad = (value: number) => String(value).padStart(2, '0');

export const toLocalDateTimeParts = (value: string): LocalDateTimeParts => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
      parsed.getDate()
    )}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
};

export const localDateTimeToIso = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const localDateAfterDays = (days: number, now = new Date()) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  return toLocalDateTimeParts(value.toISOString()).date;
};
