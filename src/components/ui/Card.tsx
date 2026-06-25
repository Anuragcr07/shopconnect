import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm md:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
