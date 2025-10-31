// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';

const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm py-4 px-6 md:px-10 flex justify-between items-center fixed w-full z-10 top-0">
      <Link href="/">
        <h1 className="text-2xl font-bold text-gray-800 hover:text-primary-blue transition-colors">
          ShopConnect
        </h1>
      </Link>
      <div className="flex items-center space-x-4">
        {session?.user ? (
          <>
            <Link href={session.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/shopkeeper/dashboard'}>
              <Button variant="ghost" className="text-gray-700 hover:text-primary-blue">
                Dashboard
              </Button>
            </Link>
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-primary-blue">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button>
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;