import React from 'react';

export function ProgressBar({ progress }) {
  return (
    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#B4902A] to-[#F3C92C] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}