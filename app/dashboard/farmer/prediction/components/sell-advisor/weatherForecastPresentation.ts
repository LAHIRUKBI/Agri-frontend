import type { WeatherForecastDay } from '../../recommendationContract';

export type WeatherIconKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'showers'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export type WeatherCodePresentation = {
  icon: WeatherIconKind;
  label: string;
};

export const getWeatherCodePresentation = (
  weatherCode: number
): WeatherCodePresentation => {
  if (weatherCode === 0) return { icon: 'clear', label: 'clear sky' };
  if (weatherCode === 1 || weatherCode === 2) {
    return { icon: 'partly-cloudy', label: 'partly cloudy' };
  }
  if (weatherCode === 3) return { icon: 'cloudy', label: 'cloudy' };
  if (weatherCode === 45 || weatherCode === 48) {
    return { icon: 'fog', label: 'fog' };
  }
  if (weatherCode >= 51 && weatherCode <= 57) {
    return { icon: 'drizzle', label: 'drizzle' };
  }
  if (weatherCode >= 61 && weatherCode <= 67) {
    return { icon: 'rain', label: 'rain' };
  }
  if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    weatherCode === 85 ||
    weatherCode === 86
  ) {
    return { icon: 'snow', label: 'snow' };
  }
  if (weatherCode >= 80 && weatherCode <= 82) {
    return { icon: 'showers', label: 'rain showers' };
  }
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return { icon: 'thunderstorm', label: 'thunderstorm' };
  }

  return { icon: 'unknown', label: 'weather unavailable' };
};

const getUtcDate = (date: string) => new Date(`${date}T00:00:00Z`);

export const formatForecastWeekday = (
  date: string,
  format: 'short' | 'long' = 'short'
) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: format,
    timeZone: 'UTC',
  }).format(getUtcDate(date));

export const getWeatherDayAriaLabel = (day: WeatherForecastDay) => {
  const weather = getWeatherCodePresentation(day.weather_code);
  const details = [weather.label];

  if (Number.isFinite(day.rain_probability)) {
    details.push(
      `${Math.round(day.rain_probability)} percent chance of rain`
    );
  }

  if (Number.isFinite(day.temperature_max_c)) {
    details.push(
      `maximum temperature ${Math.round(day.temperature_max_c)} degrees Celsius`
    );
  }

  return `${formatForecastWeekday(day.date, 'long')}: ${details.join(', ')}.`;
};

export const getRenderableForecastDays = (
  forecast?: { days?: WeatherForecastDay[] } | null
) => forecast?.days?.slice(0, 7) ?? [];
