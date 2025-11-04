// src/app/page.tsx
"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // In a real app, this might lead to a search results page or directly to post creation with pre-filled term
      console.log('Searching for:', searchTerm);
      // For now, let's redirect to create post with term
      router.push(`/customer/posts/create?item=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
        Find <span className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">Anything</span>,
        <br />
        Locally.
      </h1>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl">
        Post what you need, get offers from nearby shops. Simple, fast, local.
      </p>

      <form onSubmit={handleSearch} className="w-full max-w-md flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="e.g., iPhone 16 cover, organic milk, drill machine"
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit" className="whitespace-nowrap text-black">
          Search
        </Button>
      </form>

      <div className="mt-8">
        <p className="text-gray-500 mb-4">Or...</p>
        <Button onClick={() => router.push('/customer/posts/create')} variant="outline">
          Post Your Requirement
        </Button>
      </div>
    </div>
  );
}