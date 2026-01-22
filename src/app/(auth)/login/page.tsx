"use client";

import { Suspense, useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// UI Components
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import StatusModal from '@/components/ui/StatusModal';

/**
 * LOGIC COMPONENT
 * This component handles the actual form, hooks, and search params.
 */
function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' as 'info' | 'success' | 'error' 
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Safely get search params
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isVerified = searchParams.get('verified');

  // Show success modal if redirected from verification link
  useEffect(() => {
    if (isVerified === 'true') {
      setModalConfig({
        isOpen: true,
        title: 'Email Verified!',
        message: 'Your account is now active. You can log in below.',
        type: 'success'
      });
    }
  }, [isVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error === "PLEASE_VERIFY_EMAIL") {
        setModalConfig({
          isOpen: true,
          title: 'Verification Pending',
          message: 'Please check your inbox and verify your email before logging in.',
          type: 'info'
        });
      } else {
        setError("Invalid email or password");
      }
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <>
      {/* Our Modal */}
      <StatusModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />

      <Card className="w-full max-w-md p-8 bg-gray-800 border border-blue-700/50 shadow-2xl rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          {error && <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>}
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md shadow-md transition-all active:scale-[0.98]" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging In...' : 'Login'}
          </Button>
        </form>
        <p className="text-center text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline hover:text-blue-300 transition-colors">
            Sign Up
          </Link>
        </p>
      </Card>
    </>
  );
}

/**
 * MAIN PAGE COMPONENT
 * This is the default export. It wraps the content in Suspense to fix the build error.
 */
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-gray-900 text-gray-100">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading Login...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}