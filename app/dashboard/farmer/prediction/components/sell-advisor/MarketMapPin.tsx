'use client';

import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { AvailableMarketMapPin } from './marketMapLocations';

type MarketMapPinProps = {
  market: AvailableMarketMapPin;
  districtLabel: string;
  variant: 'compact' | 'expanded';
  active: boolean;
  onActivate: (marketValue: string) => void;
};

export default function MarketMapPin({
  market,
  districtLabel,
  variant,
  active,
  onActivate,
}: MarketMapPinProps) {
  const [hovered, setHovered] = useState(false);
  const expanded = variant === 'expanded';
  const showTooltip = hovered || active;
  const tooltipWidth = expanded ? 210 : 250;
  const tooltipHeight = expanded ? 62 : 76;
  const tooltipLeft = Math.min(
    Math.max(-market.x + 8, -tooltipWidth / 2),
    474 - market.x - tooltipWidth - 8
  );
  const tooltipTop = -(tooltipHeight + (expanded ? 20 : 16));

  const activate = (event: MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    onActivate(market.value);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      onActivate(market.value);
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onActivate(market.value);
  };

  return (
    <g
      className="group cursor-pointer outline-none"
      transform={`translate(${market.x} ${market.y})`}
      role="button"
      tabIndex={0}
      aria-label={`Available market: ${market.label}, ${districtLabel}`}
      aria-pressed={active}
      data-market-pin={market.value}
      onClick={activate}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <title>{`${market.label} — ${districtLabel}`}</title>
      <circle r={expanded ? 28 : 18} className="fill-transparent" />
      <circle
        r={expanded ? 14 : 10}
        className="fill-amber-400 stroke-amber-900 stroke-[2.5] drop-shadow-sm transition-transform duration-150 group-hover:scale-110 group-focus-visible:stroke-slate-950 group-focus-visible:stroke-[4] motion-reduce:transition-none"
      />
      <circle r={expanded ? 4.5 : 3.5} className="fill-white" />

      {showTooltip && (
        <g
          className="pointer-events-none"
          transform={`translate(${tooltipLeft} ${tooltipTop})`}
          aria-hidden="true"
        >
          <rect
            width={tooltipWidth}
            height={tooltipHeight}
            rx={expanded ? 14 : 16}
            className="fill-slate-950/95 stroke-white/70 stroke-2 drop-shadow-md"
          />
          <text
            x={expanded ? 14 : 16}
            y={expanded ? 25 : 31}
            className="fill-white font-bold"
            fontSize={expanded ? 18 : 32}
          >
            {market.label}
          </text>
          <text
            x={expanded ? 14 : 16}
            y={expanded ? 47 : 60}
            className="fill-slate-300 font-medium"
            fontSize={expanded ? 14 : 24}
          >
            {districtLabel}
          </text>
        </g>
      )}
    </g>
  );
}
