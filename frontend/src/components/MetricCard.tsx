'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ReactNode;
  accentColor: string;
  sparklineData?: number[];
  delay?: number;
  badge?: string;
}

// Animated counting number hook
function AnimatedValue({ value }: { value: string }) {
  // Extract number and affix if numeric
  const numericMatch = value.match(/([\d,.]+)/);
  const prefix = value.startsWith('$') ? '$' : '';
  const suffix = value.includes('%') ? '%' : value.includes('Critical') ? ' Critical' : '';

  const rawNum = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, '')) : null;

  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (rawNum !== null && !isNaN(rawNum)) {
      spring.set(rawNum);
      const unsubscribe = spring.on('change', (latest) => {
        if (rawNum % 1 !== 0) {
          // Decimal like 99.94
          setDisplay(`${prefix}${latest.toFixed(2)}${suffix}`);
        } else {
          // Integer like 42800 or 1
          setDisplay(`${prefix}${Math.round(latest).toLocaleString()}${suffix}`);
        }
      });
      return () => unsubscribe();
    } else {
      setDisplay(value);
    }
  }, [value, rawNum, spring, prefix, suffix]);

  return <span>{rawNum !== null ? display : value}</span>;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendPositive,
  icon,
  accentColor,
  sparklineData,
  delay = 0,
  badge,
}: MetricCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = sparklineData?.map((val, i) => ({ index: i, value: val })) || [];
  const gradientId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-w-[260px] sm:min-w-0 snap-start relative overflow-hidden"
    >
      {/* Subtle top ambient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none -mr-10 -mt-10"
        style={{ backgroundColor: accentColor }}
      />

      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center shadow-xs transition-transform hover:scale-105"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              {icon}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
          </div>

          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-4xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            <AnimatedValue value={value} />
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {subtitle && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {subtitle}
            </span>
          )}

          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-bold ${
                trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trendPositive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              {trend}
            </div>
          )}
        </div>

        {mounted && sparklineData && sparklineData.length > 0 && (
          <div className="h-10 mt-2 w-full opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accentColor}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
