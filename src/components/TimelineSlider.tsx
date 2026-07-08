'use client';

import React, { useState, useEffect } from 'react';
import { Period, PERIODS } from './PeriodConfig';
import { useTimePeriodStore } from '@/lib/store';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
  className?: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  1945: '1945\nPost-War',
  1965: '1965\nFlower Power',
  1985: '1985\nNeon',
  2005: '2005\nDigital',
  2025: '2025\nModern',
  2055: '2055\nFuture',
};

const PERIOD_COLORS: Record<Period, { bg: string; active: string; text: string }> = {
  1945: { bg: 'bg-era-1945-800', active: 'bg-era-1945-500', text: 'text-era-1945-100' },
  1965: { bg: 'bg-era-1965-800', active: 'bg-era-1965-500', text: 'text-era-1965-100' },
  1985: { bg: 'bg-era-1985-800', active: 'bg-era-1985-500', text: 'text-era-1985-100' },
  2005: { bg: 'bg-era-2005-800', active: 'bg-era-2005-500', text: 'text-era-2005-100' },
  2025: { bg: 'bg-era-2025-800', active: 'bg-era-2025-500', text: 'text-era-2025-100' },
  2055: { bg: 'bg-era-2055-800', active: 'bg-era-2055-500', text: 'text-era-2055-100' },
};

export function TimelineSlider({ className }: TimelineSliderProps) {
  const { currentPeriod, setCurrentPeriod, isTransitioning } = useTimePeriodStore();
  const currentIndex = PERIODS.indexOf(currentPeriod);

  const handlePeriodClick = (period: Period) => {
    if (isTransitioning) return;
    setCurrentPeriod(period);
  };

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50 p-4', className)}>
      <div className="glass-morphism max-w-4xl mx-auto p-4 rounded-xl">
        <div className="flex items-center justify-between gap-2">
          {PERIODS.map((period, index) => (
            <button
              key={period}
              onClick={() => handlePeriodClick(period)}
              disabled={isTransitioning}
              className={cn(
                'relative flex-1 px-4 py-3 rounded-lg transition-all duration-300',
                'disabled:cursor-not-allowed disabled:opacity-70',
                PERIOD_COLORS[period].bg,
                currentPeriod === period ? PERIOD_COLORS[period].active : 'hover:brightness-110'
              )}
            >
              <div className="text-center">
                <div className={cn('font-bold text-lg', PERIOD_COLORS[period].text)}>
                  {period}
                </div>
                <div className={cn('text-xs mt-1 leading-tight', PERIOD_COLORS[period].text)}>
                  {PERIOD_LABELS[period].split('\n')[1]}
                </div>
              </div>
              {currentPeriod === period && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            {PERIODS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex-1 h-full',
                  index < currentIndex ? 'bg-primary-500' : 'bg-transparent'
                )}
              />
            ))}
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary-500 rounded-full transition-all duration-500"
            style={{
              left: `${(currentIndex / (PERIODS.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        {isTransitioning && (
          <div className="mt-2 text-center text-sm text-primary-300 animate-pulse">
            Transforming...
          </div>
        )}
      </div>
    </div>
  );
}