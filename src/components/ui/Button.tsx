// src/components/ui/Button.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge'; // npm install tailwind-merge

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  ...props
}) => {
  const baseStyles =
    'px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyles = {
    primary:
      'bg-gradient-button hover:opacity-90 active:scale-98 shadow-md shadow-primary-purple/30',
    outline:
      'bg-transparent border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      className={twMerge(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;