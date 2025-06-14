
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g., 'text-brand-primary'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-brand-primary' 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-[6px]',
  };

  return (
    <div 
      className={`animate-spin rounded-full border-solid border-t-transparent ${sizeClasses[size]} ${color}`}
      style={{ borderTopColor: 'transparent' }} // Ensure transparent part for spinning effect
    role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
