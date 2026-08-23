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

  return (
    <section
      aria-labelledby="ai-recommendation-context-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
    >
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Decision support
        </p>
        <h3
          id="ai-recommendation-context-heading"
          className="mt-1 text-xl font-bold text-gray-900 md:text-2xl"
        >
          AI recommendation context
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Practical context can affect harvesting and selling operations, but it
          does not override the decision shown above or guarantee a price effect.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {groups.map((group) => (
          <div
            key={group.key}
            className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 p-4"
          >
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {group.title}
            </h4>
            <div
              className={
                group.key === 'market_outlook'
                  ? 'mt-3 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3'
                  : group.key === 'practical_context'
                    ? 'mt-3 grid min-w-0 gap-4 md:grid-cols-2'
                    : 'mt-3 grid min-w-0 gap-4'
              }
            >
              {group.items.map((item) => (
                <div key={item.key} className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words text-base leading-7 text-gray-900">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
