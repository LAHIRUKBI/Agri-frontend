import {
  BoltIcon,
  CloudIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import type { WeatherForecast } from '../../recommendationContract';
import {
  formatForecastWeekday,
  getRenderableForecastDays,
  getWeatherCodePresentation,
  getWeatherDayAriaLabel,
  type WeatherIconKind,
} from './weatherForecastPresentation';

type WeatherForecastStripProps = {
  forecast?: WeatherForecast | null;
};

const RainMarks = ({ count = 3 }: { count?: 2 | 3 }) => (
  <span className="absolute inset-x-1 bottom-0 flex justify-around" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <span
        key={index}
        className="h-2 w-0.5 rotate-[18deg] rounded-full bg-sky-500"
      />
    ))}
  </span>
);

const WeatherGlyph = ({ kind }: { kind: WeatherIconKind }) => {
  if (kind === 'clear') {
    return (
      <SunIcon
        className="size-10 fill-amber-100 text-amber-500"
        aria-hidden="true"
      />
    );
  }

  if (kind === 'partly-cloudy') {
    return (
      <span className="relative block size-10" aria-hidden="true">
        <SunIcon className="absolute right-0 top-0 size-7 fill-amber-100 text-amber-500" />
        <CloudIcon className="absolute bottom-0 left-0 size-9 fill-white text-sky-700" />
      </span>
    );
  }

  if (kind === 'thunderstorm') {
    return (
      <span className="relative block size-10" aria-hidden="true">
        <CloudIcon className="size-10 fill-slate-100 text-slate-600" />
        <BoltIcon className="absolute -bottom-1 left-4 size-5 fill-amber-300 text-amber-600" />
      </span>
    );
  }

  if (kind === 'drizzle') {
    return (
      <span className="relative block h-11 w-10" aria-hidden="true">
        <CloudIcon className="size-10 fill-sky-50 text-sky-600" />
        <RainMarks count={2} />
      </span>
    );
  }

  if (kind === 'rain' || kind === 'showers') {
    return (
      <span className="relative block h-11 w-10" aria-hidden="true">
        <CloudIcon
          className={`size-10 ${
            kind === 'showers'
              ? 'fill-sky-100 text-sky-700'
              : 'fill-slate-50 text-sky-700'
          }`}
        />
        <RainMarks />
      </span>
    );
  }

  if (kind === 'fog') {
    return (
      <span className="relative block h-11 w-10" aria-hidden="true">
        <CloudIcon className="size-9 fill-slate-50 text-slate-500" />
        <span className="absolute bottom-1.5 left-0 h-0.5 w-10 rounded-full bg-slate-400" />
        <span className="absolute bottom-0 left-1 h-0.5 w-8 rounded-full bg-slate-300" />
      </span>
    );
  }

  if (kind === 'snow') {
    return (
      <span className="relative block h-11 w-10" aria-hidden="true">
        <CloudIcon className="size-10 fill-sky-50 text-sky-600" />
        <span className="absolute bottom-0 left-2 size-1 rounded-full bg-sky-500" />
        <span className="absolute bottom-0 right-2 size-1 rounded-full bg-sky-500" />
      </span>
    );
  }

  return (
    <CloudIcon
      className={`size-10 fill-white ${
        kind === 'unknown' ? 'text-slate-400' : 'text-slate-600'
      }`}
      aria-hidden="true"
    />
  );
};

export default function WeatherForecastStrip({
  forecast,
}: WeatherForecastStripProps) {
  const days = getRenderableForecastDays(forecast);

  if (!forecast || days.length === 0) return null;

  return (
    <section
      aria-label={`Next 7 days weather forecast for ${forecast.location}`}
      data-testid="weather-forecast-strip"
      className="w-[calc(100vw-1.5rem)] max-w-full rounded-[1.35rem] border border-sky-100 bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/30 px-4 py-4 shadow-sm sm:w-full sm:px-5"
    >
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <CloudIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="whitespace-nowrap text-base font-black leading-tight text-sky-950">
            Next 7 Days Forecast
          </h3>
          <p className="truncate text-sm font-semibold text-sky-700">
            {forecast.location}
          </p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max divide-x divide-sky-100 sm:grid sm:min-w-0 sm:grid-cols-7">
          {days.map((day) => {
            const weather = getWeatherCodePresentation(day.weather_code);
            const rainProbability = Number.isFinite(day.rain_probability)
              ? Math.round(day.rain_probability)
              : null;
            const maximumTemperature = Number.isFinite(day.temperature_max_c)
              ? Math.round(day.temperature_max_c)
              : null;

            return (
              <div
                key={day.date}
                role="group"
                aria-label={getWeatherDayAriaLabel(day)}
                data-testid="weather-forecast-day"
                data-weather-icon={weather.icon}
                className="flex w-[5.75rem] shrink-0 flex-col items-center px-3 py-2 text-center sm:w-auto sm:min-w-0 sm:px-3"
              >
                <p className="text-sm font-bold text-slate-600">
                  {formatForecastWeekday(day.date)}
                </p>
                <span className="mt-1 flex h-11 items-center justify-center text-sky-700">
                  <WeatherGlyph kind={weather.icon} />
                </span>
                {rainProbability !== null && (
                  <p className="mt-1 whitespace-nowrap text-base font-black leading-none text-sky-800">
                    {rainProbability}%{' '}
                    <span className="text-[11px] font-bold">rain</span>
                  </p>
                )}
                {maximumTemperature !== null && (
                  <p className="mt-1.5 whitespace-nowrap text-xs font-semibold text-slate-500">
                    Max {maximumTemperature}°C
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 px-1 text-[10px] leading-4 text-slate-500">
        Rain chance · Forecast location: {forecast.location} · Open-Meteo
      </p>
    </section>
  );
}
