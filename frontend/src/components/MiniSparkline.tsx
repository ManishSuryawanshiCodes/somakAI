'use client';

import React from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: 'emerald' | 'indigo' | 'rose' | 'amber' | 'slate';
  width?: number;
  height?: number;
  strokeWidth?: number;
  showGradient?: boolean;
  className?: string;
}

const COLOR_MAP = {
  emerald: {
    stroke: '#10B981',
    stop: '#10B981',
    cssClass: 'text-emerald-500',
  },
  indigo: {
    stroke: '#6366F1',
    stop: '#6366F1',
    cssClass: 'text-indigo-500',
  },
  rose: {
    stroke: '#F43F5E',
    stop: '#F43F5E',
    cssClass: 'text-rose-500',
  },
  amber: {
    stroke: '#F59E0B',
    stop: '#F59E0B',
    cssClass: 'text-amber-500',
  },
  slate: {
    stroke: '#94A3B8',
    stop: '#94A3B8',
    cssClass: 'text-slate-400',
  },
};

export default function MiniSparkline({
  data = [12, 10, 14, 18, 15, 11, 8, 9, 7, 5, 4, 3],
  color = 'emerald',
  width = 56,
  height = 18,
  strokeWidth = 1.75,
  showGradient = false,
  className = '',
}: MiniSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 2;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * effectiveWidth;
    const y = height - padding - ((val - min) / range) * effectiveHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const gradientId = React.useId();
  const activeColor = COLOR_MAP[color] || COLOR_MAP.emerald;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible inline-block shrink-0 ${activeColor.cssClass} ${className}`}
      aria-hidden="true"
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={activeColor.stop} stopOpacity="0.25" />
            <stop offset="100%" stopColor={activeColor.stop} stopOpacity="0.0" />
          </linearGradient>
        </defs>
      )}

      {showGradient && (
        <path d={areaD} fill={`url(#${gradientId})`} />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={activeColor.stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
