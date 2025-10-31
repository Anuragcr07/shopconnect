// src/components/ui/Card.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-white p-6 rounded-xl shadow-md border border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;