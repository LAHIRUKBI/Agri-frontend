'use client';

import { useMemo, useState } from 'react';
import {
  CROPS,
  DISTRICTS,
  getQuantityRangesForCrop,
} from '@/utils/prediction-options';

type Props = {
  onSubmit: (payload: {
    crop: string;
    district: string;
    price_rs_kg?: number;
    current_price_source: 'manual' | 'system';
    horizon: number;
    harvest_input_mode: 'range' | 'exact';
    quantity_kg: number;
    quantity_min_kg?: number;
    quantity_max_kg?: number;
    quantity_range_label?: string;
    exact_quantity_kg?: number;
  }) => void;
  loading: boolean;
};

export default function RecommendationForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    crop: '',
    district: '',
    price_rs_kg: '',
    current_price_source: 'manual' as 'manual' | 'system',
    harvest_input_mode: 'range' as 'range' | 'exact',
    quantity_range_label: '',
    exact_quantity_kg: '',
  });

  const horizon = 1;
  const [localError, setLocalError] = useState('');

  const formatLabel = (value: string) =>
    value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const quantityOptions = useMemo(() => {
    return getQuantityRangesForCrop(form.crop);
  }, [form.crop]);

  const selectedQuantity = quantityOptions.find(
    (option) => option.label === form.quantity_range_label
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'crop') {
        return {
          ...prev,
          crop: value,
          quantity_range_label: '',
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const validateForm = () => {
    if (!form.crop) return 'Please select a crop';
    if (!form.district) return 'Please select a district';
    if (
      form.current_price_source === 'manual' &&
      (!form.price_rs_kg || Number(form.price_rs_kg) <= 0)
    ) {
      return 'Price must be greater than 0';
    }
    if (form.harvest_input_mode === 'range' && !form.quantity_range_label) {
      return 'Please select an expected harvest amount';
    }
    if (form.harvest_input_mode === 'range' && !selectedQuantity) {
      return 'Invalid expected harvest amount selected';
    }
    if (
      form.harvest_input_mode === 'exact' &&
      (!form.exact_quantity_kg || Number(form.exact_quantity_kg) <= 0)
    ) {
      return 'Exact harvest quantity must be greater than 0';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError('');

    const exactQuantity = Number(form.exact_quantity_kg);
    const requestPrice =
      form.current_price_source === 'manual'
        ? Number(form.price_rs_kg)
        : undefined;

    onSubmit({
      crop: form.crop,
      district: form.district,
      ...(requestPrice !== undefined ? { price_rs_kg: requestPrice } : {}),
      current_price_source: form.current_price_source,
      horizon,
      harvest_input_mode: form.harvest_input_mode,
      quantity_kg:
        form.harvest_input_mode === 'exact'
          ? exactQuantity
          : selectedQuantity?.value || 0,
      quantity_min_kg:
        form.harvest_input_mode === 'range' ? selectedQuantity?.min : undefined,
      quantity_max_kg:
        form.harvest_input_mode === 'range' ? selectedQuantity?.max : undefined,
      quantity_range_label:
        form.harvest_input_mode === 'range'
          ? form.quantity_range_label
          : undefined,
      exact_quantity_kg:
        form.harvest_input_mode === 'exact' ? exactQuantity : undefined,
    });
  };

  const horizonLabel = 'Next market period';

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Current Price Source
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="current_price_source"
                value="manual"
                checked={form.current_price_source === 'manual'}
                onChange={handleChange}
                className="h-4 w-4 accent-green-600"
              />
              I know today&apos;s selling price
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="current_price_source"
                value="system"
                checked={form.current_price_source === 'system'}
                onChange={handleChange}
                className="h-4 w-4 accent-green-600"
              />
              Use system current market price
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Crop
            </label>
            <select
              name="crop"
              value={form.crop}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Crop</option>
              {CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {formatLabel(crop)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              District
            </label>
            <select
              name="district"
              value={form.district}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select District</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {formatLabel(district)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Prediction Horizon
            </label>
            <div className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800">
              Next market period
            </div>
          </div>

          {form.current_price_source === 'manual' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Current Price (Rs/kg)
              </label>
              <input
                type="number"
                name="price_rs_kg"
                value={form.price_rs_kg}
                onChange={handleChange}
                placeholder="120"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Harvest Input
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="harvest_input_mode"
                value="range"
                checked={form.harvest_input_mode === 'range'}
                onChange={handleChange}
                className="h-4 w-4 accent-green-600"
              />
              Select Range
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="harvest_input_mode"
                value="exact"
                checked={form.harvest_input_mode === 'exact'}
                onChange={handleChange}
                className="h-4 w-4 accent-green-600"
              />
              Enter Exact Quantity (kg)
            </label>
          </div>

          <div className="mt-4">
            {form.harvest_input_mode === 'range' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Expected Harvest Amount
                </label>
                <select
                  name="quantity_range_label"
                  value={form.quantity_range_label}
                  onChange={handleChange}
                  disabled={!form.crop}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {form.crop
                      ? 'Select Expected Harvest Amount'
                      : 'Select Crop First'}
                  </option>
                  {quantityOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Exact Harvest Quantity (kg)
                </label>
                <input
                  type="number"
                  name="exact_quantity_kg"
                  value={form.exact_quantity_kg}
                  onChange={handleChange}
                  placeholder="120"
                  min="0"
                  step="0.1"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm leading-6 text-yellow-800">
            Markets are automatically selected based on your district. The
            forecast is set to{' '}
            <span className="font-semibold">{horizonLabel}</span>.
            {form.harvest_input_mode === 'range' && selectedQuantity && (
              <>
                {' '}Earnings are estimated using an approximate quantity based
                on your selected harvest range ({' '}
                <span className="font-semibold">
                  {form.quantity_range_label}
                </span>
                ).
              </>
            )}
            {form.harvest_input_mode === 'exact' && form.exact_quantity_kg && (
              <>
                {' '}Earnings are estimated using your exact harvest quantity of{' '}
                <span className="font-semibold">
                  {form.exact_quantity_kg} kg
                </span>
                .
              </>
            )}
          </p>

          {form.current_price_source === 'manual' && Number(form.price_rs_kg) > 1500 && (
            <p className="mt-2 text-sm text-orange-800">
              ⚠ This price is unusually high. Predictions may be less reliable
              under extreme market conditions.
            </p>
          )}
        </div>

        {localError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{localError}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="min-w-[220px] rounded-xl bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
          >
            {loading ? 'Processing...' : 'Get Recommendation'}
          </button>
        </div>
      </form>
    </div>
  );
}
