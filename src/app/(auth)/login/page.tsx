"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // Start loading

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false); // End loading

    if (result?.error) {
      setError(result.error);
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-gray-900 text-gray-100">
      <Card className="w-full max-w-md p-8 bg-gray-800 border border-blue-700/50 shadow-2xl rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Login to LocalTrade Hub</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500" // Custom input style
            labelClassName="text-gray-300" // Custom label style
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500" // Custom input style
            labelClassName="text-gray-300" // Custom label style
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md shadow-md transition-colors" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </Button>
        </form>
        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline hover:text-blue-300 transition-colors">
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}