// src/app/(customer)/posts/create/page.tsx
"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea'; // We'll create this simple component

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
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Post Your Requirement</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="What are you looking for?"
            type="text"
            placeholder="e.g., iPhone 16 cover"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea // Use Textarea for longer descriptions
            label="Describe your requirement (optional)"
            placeholder="I need a specific color or model, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post Requirement'}
          </Button>
        </form>
      </Card>
    </div>
  );
}