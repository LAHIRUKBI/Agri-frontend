export type ModelMetricPresentation = {
  key: string;
  label: string;
  value: string;
};

const getNormalizedMetricKey = (key: string) =>
  key.trim().toLowerCase().replace(/[\s-]+/g, '_');

const getMetricLabel = (key: string) => {
  const normalizedKey = getNormalizedMetricKey(key);

  if (normalizedKey === 'mae') return 'MAE';
  if (normalizedKey === 'rmse') return 'RMSE';
  if (
    normalizedKey === 'r2' ||
    normalizedKey === 'r_2' ||
    normalizedKey === 'r_squared' ||
    normalizedKey === 'r2_score'
  ) {
    return 'R²';
  }
  if (normalizedKey === 'mape') return 'MAPE';

  return key.replace(/[_-]+/g, ' ').trim().toUpperCase();
};

const formatNumericMetric = (key: string, value: number) => {
  const normalizedKey = getNormalizedMetricKey(key);

  if (
    normalizedKey === 'r2' ||
    normalizedKey === 'r_2' ||
    normalizedKey === 'r_squared' ||
    normalizedKey === 'r2_score'
  ) {
    return value.toFixed(3);
  }

  if (normalizedKey === 'mape') return `${value.toFixed(2)}%`;
  if (normalizedKey === 'mae' || normalizedKey === 'rmse') {
    return value.toFixed(2);
  }

  return Number(value.toFixed(3)).toString();
};

const getMetricValue = (key: string, value: unknown): string | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? formatNumericMetric(key, value) : null;
  }

  if (typeof value !== 'string' || !value.trim()) return null;

  const trimmedValue = value.trim();
  const parsedValue = Number(trimmedValue.replace('%', ''));

  return Number.isFinite(parsedValue)
    ? formatNumericMetric(key, parsedValue)
    : trimmedValue;
};

export const getModelMetricPresentations = (
  metrics: Record<string, unknown> | null | undefined
): ModelMetricPresentation[] => {
  if (!metrics) return [];

  return Object.entries(metrics).flatMap(([key, value]) => {
    const displayValue = getMetricValue(key, value);

    return displayValue
      ? [{ key, label: getMetricLabel(key), value: displayValue }]
      : [];
  });
};
