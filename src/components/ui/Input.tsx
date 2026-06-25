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
        <label htmlFor={props.id} className={clsx("text-sm font-bold text-slate-700", labelClassName)}>
          {label}
        </label>
      )}
      <input
        className={twMerge(
          'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;
