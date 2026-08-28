'use client';

export default function TransparencyNote() {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <section>
        <h3 className="text-sm font-black text-slate-900">Limitations</h3>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
          <li>
            This estimate is based on historical patterns and may change with
            real market conditions.
          </li>
          <li>
            The experimental estimate is guidance, not a guaranteed next-period
            price or a firm sell/wait instruction.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-black text-slate-900">Data sources</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Data sources used in this system include HARTI market price data, DCS
          market price data, DOA seasonal data, weather records, and inflation
          data.
        </p>
      </section>
    </div>
  );
}
