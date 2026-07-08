import * as React from 'react';
import { cn } from '../../lib/cn';

/**
 * Minimal accessible slider built on a styled <input type="range">.
 * Avoids pulling in Radix Slider to keep bundle size down.
 */
export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string;
  /** Called with the numeric value. */
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, onValueChange, value, min = 0, max = 1, step = 0.01, id, ...props }, ref) => {
    const sliderId = id ?? React.useId();
    return (
      <div className="flex items-center gap-2">
        {label && (
          <label htmlFor={sliderId} className="text-xs text-white/60 whitespace-nowrap w-12">
            {label}
          </label>
        )}
        <input
          id={sliderId}
          ref={ref}
          type="range"
          className={cn(
            'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none',
            'accent-[var(--era-accent)]',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110',
            '[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white',
            className,
          )}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          {...props}
        />
      </div>
    );
  },
);
Slider.displayName = 'Slider';

export { Slider };
