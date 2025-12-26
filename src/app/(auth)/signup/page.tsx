"use client";

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // To auto-login after signup

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SHOPKEEPER'>('CUSTOMER');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, shopName, address, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    // DON'T signIn() here. Instead, tell user to check email.
    alert("Verification email sent! Please check your inbox.");
    router.push('/login');

  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-gray-900 text-gray-100">
      <Card className="w-full max-w-lg p-8 bg-gray-800 border border-blue-700/50 shadow-2xl rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Join LocalTrade Hub</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            labelClassName="text-gray-300"
          />
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            labelClassName="text-gray-300"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
            labelClassName="text-gray-300"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">I am a:</label>
            <div className="flex space-x-4">
              <Button
                type="button"
                // Using new custom styles for role selection buttons
                className={`flex-1 font-semibold py-2 rounded-md transition-colors ${
                  role === 'CUSTOMER'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                }`}
                onClick={() => setRole('CUSTOMER')}
              >
                Customer
              </Button>
              <Button
                type="button"
                className={`flex-1 font-semibold py-2 rounded-md transition-colors ${
                  role === 'SHOPKEEPER'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                }`}
                onClick={() => setRole('SHOPKEEPER')}
              >
                Shopkeeper
              </Button>
            </div>
          </div>

          {role === 'SHOPKEEPER' && (
            <>
              <Input
                label="Shop Name"
                type="text"
                placeholder="My Local Store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required={role === 'SHOPKEEPER'}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                labelClassName="text-gray-300"
              />
              <Input
                label="Shop Address"
                type="text"
                placeholder="123 Main St, City, Zip"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={role === 'SHOPKEEPER'}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                labelClassName="text-gray-300"
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={role === 'SHOPKEEPER'}
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                labelClassName="text-gray-300"
              />
            </>
          )}

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md shadow-md transition-colors" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline hover:text-blue-300 transition-colors">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}