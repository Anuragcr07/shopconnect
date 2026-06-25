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
        <label htmlFor={props.id} className={twMerge('text-sm font-bold text-slate-700', labelClassName)}>
          {label}
        </label>
      )}
      <textarea
        className={twMerge(
          'min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100',
          className
        )}
        {...props}
      />
    </div>
  );
};

export { Textarea };
