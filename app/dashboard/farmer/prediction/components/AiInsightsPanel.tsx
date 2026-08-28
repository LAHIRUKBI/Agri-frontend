import {
  type AiInsights,
  getAiInsightGroups,
} from '../recommendationContract';

type Props = {
  aiInsights?: AiInsights | null;
};

export default function AiInsightsPanel({ aiInsights }: Props) {
  const groups = getAiInsightGroups(aiInsights);

  if (groups.length === 0) return null;

  const items = groups.flatMap((group) => group.items);
  const primaryDefinitions = [
    {
      key: 'prediction_summary',
      title: 'Market outlook',
      className: 'border-teal-200 bg-teal-50/60',
    },
    {
      key: 'why_this_matters',
      title: 'Why this matters',
      className: 'border-slate-200 bg-white',
    },
    {
      key: 'suggested_action',
      title: 'What you can do',
      className: 'border-emerald-200 bg-emerald-50/50',
    },
  ] as const;
  const primaryItems = primaryDefinitions.flatMap((definition) => {
    const item = items.find((candidate) => candidate.key === definition.key);
    return item ? [{ ...definition, text: item.text }] : [];
  });
  const primaryKeys = new Set(primaryDefinitions.map(({ key }) => key));
  const seenTexts = new Set(
    primaryItems.map(({ text }) => text.trim().toLowerCase())
  );
  const supplementalItems = items.filter((item) => {
    const normalizedText = item.text.trim().toLowerCase();
    if (primaryKeys.has(item.key as (typeof primaryDefinitions)[number]['key'])) {
      return false;
    }
    if (seenTexts.has(normalizedText)) return false;
    seenTexts.add(normalizedText);
    return true;
  });

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <p className="max-w-4xl text-sm leading-6 text-slate-600">
        Practical context can support harvesting and selling operations, but it
        does not override the canonical decision or guarantee a price effect.
      </p>

      {primaryItems.length > 0 && (
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
          {primaryItems.map((item) => (
            <article
              key={item.key}
              className={`min-w-0 rounded-xl border p-4 ${item.className}`}
            >
              <h3 className="text-sm font-black text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      )}

      {supplementalItems.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Additional context
          </p>
          <dl className="mt-2 grid min-w-0 gap-x-6 gap-y-3 md:grid-cols-2">
            {supplementalItems.map((item) => (
              <div key={item.key} className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500">
                  {item.label}
                </dt>
                <dd className="mt-1 break-words text-sm leading-6 text-slate-700">
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
