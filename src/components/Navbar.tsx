// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Button from '@/components/ui/Button'; // Assuming your Button component supports Tailwind classes

const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white shadow-lg py-4 px-6 md:px-10 flex justify-between items-center fixed w-full z-20 top-0 border-b border-blue-700/50">
      <Link href="/" className="flex items-center space-x-2">
        {/* You can replace this SVG with your actual logo component or an Image if you have one */}
        <svg
          className="w-8 h-8 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          ></path>
        </svg>
        <h1 className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
          LocalTrade Hub
        </h1>
      </Link>
      <div className="flex items-center space-x-4">
        {session?.user ? (
          <>
            <Link href={session.user.role === 'CUSTOMER' ? '/customer/dashboard' : '/shopkeeper/dashboard'}>
              <Button variant="ghost" className="text-gray-200 hover:text-blue-400 hover:bg-gray-700/50 transition-colors px-4 py-2 rounded-md">
                Dashboard
              </Button>
            </Link>
            <Button onClick={() => signOut()} variant="outline" className="text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 transition-colors px-4 py-2 rounded-md">
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="text-gray-200 hover:text-blue-400 hover:bg-gray-700/50 transition-colors px-4 py-2 rounded-md">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition-colors">
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