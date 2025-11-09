// src/components/ui/Input.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, className, labelClassName, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={props.id} className={clsx("text-sm font-medium", labelClassName)}>
          {label}
        </label>
      )}
      <input
        className={twMerge(
          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none shadow-sm transition-shadow duration-200',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;