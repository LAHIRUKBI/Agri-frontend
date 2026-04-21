'use client';

import { useMemo, useState } from 'react';
import { CROPS, DISTRICTS } from '@/utils/prediction-options';

type Props = {
  onSubmit: (payload: {
    crop: string;
    district: string;
    price_rs_kg: number;
    horizon: number;
    quantity_kg: number;
    quantity_range_label: string;
  }) => void;
  loading: boolean;
};

type QuantityRange = {
  label: string;
  value: number;
};

const QUANTITY_RANGES: Record<string, QuantityRange[]> = {
  beans: [
    { label: '25–75 kg', value: 50 },
    { label: '76–150 kg', value: 110 },
    { label: '151–300 kg', value: 225 },
    { label: '301–500 kg', value: 400 },
    { label: '500+ kg', value: 600 },
  ],
  chili: [
    { label: '25–75 kg', value: 50 },
    { label: '76–150 kg', value: 110 },
    { label: '151–300 kg', value: 225 },
    { label: '301–500 kg', value: 400 },
    { label: '500+ kg', value: 600 },
  ],
  eggplants: [
    { label: '50–150 kg', value: 100 },
    { label: '151–300 kg', value: 225 },
    { label: '301–600 kg', value: 450 },
    { label: '601–1000 kg', value: 800 },
    { label: '1000+ kg', value: 1200 },
  ],
  'snake gourd': [
    { label: '50–150 kg', value: 100 },
    { label: '151–300 kg', value: 225 },
    { label: '301–600 kg', value: 450 },
    { label: '601–1000 kg', value: 800 },
    { label: '1000+ kg', value: 1200 },
  ],
  tomatoes: [
    { label: '50–150 kg', value: 100 },
    { label: '151–300 kg', value: 225 },
    { label: '301–600 kg', value: 450 },
    { label: '601–1000 kg', value: 800 },
    { label: '1000+ kg', value: 1200 },
  ],
  cabbage: [
    { label: '50–150 kg', value: 100 },
    { label: '151–300 kg', value: 225 },
    { label: '301–600 kg', value: 450 },
    { label: '601–1000 kg', value: 800 },
    { label: '1000+ kg', value: 1200 },
  ],
  carrots: [
    { label: '50–150 kg', value: 100 },
    { label: '151–300 kg', value: 225 },
    { label: '301–600 kg', value: 450 },
    { label: '601–1000 kg', value: 800 },
    { label: '1000+ kg', value: 1200 },
  ],
  pumpkin: [
    { label: '100–300 kg', value: 200 },
    { label: '301–700 kg', value: 500 },
    { label: '701–1200 kg', value: 950 },
    { label: '1201–2000 kg', value: 1500 },
    { label: '2000+ kg', value: 2200 },
  ],
};

export default function RecommendationForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    crop: '',
    district: '',
    price_rs_kg: '',
    quantity_range_label: '',
  });

  const [horizon, setHorizon] = useState(1);
  const [localError, setLocalError] = useState('');

  const formatLabel = (value: string) =>
    value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const quantityOptions = useMemo(() => {
    if (!form.crop) return [];
    return QUANTITY_RANGES[form.crop] || [];
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
    if (!form.price_rs_kg || Number(form.price_rs_kg) <= 0) {
      return 'Price must be greater than 0';
    }
    if (!form.quantity_range_label) {
      return 'Please select a quantity range';
    }
    if (!selectedQuantity) {
      return 'Invalid quantity range selected';
    }
    if (![1, 2, 3, 4].includes(horizon)) {
      return 'Invalid prediction horizon';
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

    onSubmit({
      crop: form.crop,
      district: form.district,
      price_rs_kg: Number(form.price_rs_kg),
      horizon,
      quantity_kg: selectedQuantity?.value || 0,
      quantity_range_label: form.quantity_range_label,
    });
  };

  const horizonLabel =
    horizon === 1
      ? 'Next week'
      : horizon === 2
      ? '2 weeks ahead'
      : horizon === 3
      ? '3 weeks ahead'
      : '4 weeks ahead';

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500"
            >
              <option value={1}>Next week</option>
              <option value={2}>2 weeks ahead</option>
              <option value={3}>3 weeks ahead</option>
              <option value={4}>4 weeks ahead</option>
            </select>
          </div>

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

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Quantity Range
            </label>
            <select
              name="quantity_range_label"
              value={form.quantity_range_label}
              onChange={handleChange}
              disabled={!form.crop}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">
                {form.crop ? 'Select Quantity Range' : 'Select Crop First'}
              </option>
              {quantityOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm leading-6 text-yellow-800">
            The system automatically checks mapped markets for your district.
            Recommendation horizon is set to{' '}
            <span className="font-semibold">{horizonLabel}</span>.
            {selectedQuantity && (
              <>
                {' '}
                Earnings estimates use an approximate quantity based on the{' '}
                <span className="font-semibold">{form.quantity_range_label}</span>{' '}
                range.
              </>
            )}
          </p>
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