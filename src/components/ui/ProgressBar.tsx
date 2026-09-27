import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  showLabel = false,
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-[#EAEAE5] rounded-full h-2 overflow-hidden">
        <div
          className="bg-[#1F7AFF] h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1.5">
          <span className="text-xs font-medium text-[#5A6A85]">{clampedValue}%</span>
        </div>
      )}
    </div>
  );
};
