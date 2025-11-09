// src/components/ui/Textarea.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, labelClassName, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={props.id} className={twMerge("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
        </label>
      )}
      <textarea
        className={twMerge(
          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none shadow-sm transition-shadow duration-200 resize-y',
          className
        )}
        {...props}
      />
    </div>
  );
};

export { Textarea };