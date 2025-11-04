// src/app/(auth)/signup/page.tsx
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, shopName: role === 'SHOPKEEPER' ? shopName : undefined, address: role === 'SHOPKEEPER' ? address : undefined, phone: role === 'SHOPKEEPER' ? phone : undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Signup failed');
      }

      // Automatically sign in after successful signup
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        setError("Signup successful, but failed to log in automatically: " + signInResult.error);
        router.push('/login'); // Redirect to login if auto-login fails
      } else {
        router.push(role === 'CUSTOMER' ? '/customer/dashboard' : '/shopkeeper/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Join ShopConnect</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={role === 'CUSTOMER' ? 'primary' : 'outline'}
                onClick={() => setRole('CUSTOMER')}
                className="flex-1 text-black"
              >
                Customer
              </Button>
              <Button
                type="button"
                variant={role === 'SHOPKEEPER' ? 'primary' : 'outline'}
                onClick={() => setRole('SHOPKEEPER')}
                className="flex-1 text-black"
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
              />
              <Input
                label="Shop Address"
                type="text"
                placeholder="123 Main St, City, Zip"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={role === 'SHOPKEEPER'}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={role === 'SHOPKEEPER'}
              />
            </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full text-black" disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-blue hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}