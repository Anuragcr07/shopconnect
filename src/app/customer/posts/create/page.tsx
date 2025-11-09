"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea'; // Make sure this component is defined with proper styles

export default function CreateCustomerPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItem = searchParams.get('item');

  const [title, setTitle] = useState(initialItem || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem);
      setDescription(`Looking for a ${initialItem}. Please let me know if you have it in stock.`);
    }
  }, [initialItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create post');
      }

      router.push('/customer/dashboard'); // Redirect to dashboard after successful post
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-gray-900 text-gray-100 pt-20"> {/* Added pt-20 */}
      <Card className="w-full max-w-md p-8 bg-gray-800 border border-blue-700/50 shadow-2xl rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Post Your Requirement</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="What are you looking for?"
            type="text"
            placeholder="e.g., iPhone 16 cover"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            labelClassName="text-gray-300"
          />
          <Textarea // Assuming Textarea also accepts className and labelClassName
            label="Describe your requirement (optional)"
            placeholder="I need a specific color or model, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            labelClassName="text-gray-300"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md shadow-md transition-colors" disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post Requirement'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// You need to ensure your Textarea component exists and supports the className/labelClassName props.
// Here's a basic Textarea component you can use if you don't have one:
// src/components/ui/Textarea.tsx
// "use client";
// import React from 'react';
// import { twMerge } from 'tailwind-merge'; // or simple string concatenation if preferred

// interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
//   label: string;
//   labelClassName?: string;
// }

// export const Textarea: React.FC<TextareaProps> = ({ label, id, labelClassName, className, ...props }) => {
//   const textareaId = id || label.toLowerCase().replace(/\s/g, '-');
//   return (
//     <div>
//       <label htmlFor={textareaId} className={twMerge("block text-sm font-medium text-gray-700 mb-2", labelClassName)}>
//         {label}
//       </label>
//       <textarea
//         id={textareaId}
//         className={twMerge(
//           "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
//           className
//         )}
//         {...props}
//       />
//     </div>
//   );
// };