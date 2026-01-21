"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/Textarea';

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
      setDescription(`I am looking for a ${initialItem}. Please let me know the price and if it is currently in stock.`);
    }
  }, [initialItem]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim()) return setError("Title is required");
  
  setIsLoading(true);

  // Get current location
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch('/api/customer/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            description, 
            latitude, 
            longitude 
          }),
        });

        if (response.ok) router.push('/customer/dashboard');
      } catch (err) {
        setError("Failed to post");
      } finally {
        setIsLoading(false);
      }
    },
    (error) => {
      setError("Please enable location to find nearby shops.");
      setIsLoading(false);
    }
  );
};
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900 pt-20">
      <Card className="w-full max-w-md p-8 bg-gray-800 border border-blue-700/50 shadow-2xl rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Create Request</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Ask local shops for what you need</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="What are you looking for?"
            placeholder="e.g. Sony Headphones, Fresh Milk"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
          
          <Textarea
            label="Details (Size, Color, Urgency)"
            placeholder="Tell shopkeepers more about your requirement..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="bg-gray-700 border-gray-600 text-white"
          />

          {error && <div className="bg-red-900/20 border border-red-500/50 p-3 rounded text-red-400 text-sm">{error}</div>}
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold transition-all active:scale-95" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending to Shops...' : 'Post Requirement'}
          </Button>
        </form>
      </Card>
    </div>
  );
}