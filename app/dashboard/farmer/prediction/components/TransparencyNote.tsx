'use client';

export default function TransparencyNote() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Note
      </p>
      <p className="mt-2 text-base leading-7 text-gray-800">
        This estimate is based on historical patterns and may change with real
        market conditions.
      </p>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        Data sources used in this system include HARTI market price data, DCS
        market price data, DOA seasonal data, weather records, and inflation
        data.
      </p>
    </div>
  );
}
