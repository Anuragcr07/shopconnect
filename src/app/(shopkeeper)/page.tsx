// src/app/(shopkeeper)/dashboard/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';

interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  responses: {
    id: string;
    shopkeeperId: string;
    isAvailable: boolean;
    message: string | null;
  }[];
}

export default function ShopkeeperDashboardPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<CustomerPost[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({}); // postId -> message

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'SHOPKEEPER') {
      redirect('/customer/dashboard'); // Redirect if not a shopkeeper
    }
    if (status === 'authenticated' && session?.user.role === 'SHOPKEEPER') {
      fetchShopRequests();
    }
  }, [status, session]);

  const fetchShopRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch('/api/shopkeeper/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch shop requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching shop requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRespondToRequest = async (postId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/shopkeeper/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerPostId: postId,
          isAvailable,
          message: responseMessage[postId] || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send response');
      }

      // Clear message and re-fetch requests
      setResponseMessage(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
      fetchShopRequests();
      alert('Response sent successfully!');
    } catch (error: any) {
      console.error('Error responding to request:', error);
      alert(error.message || 'Failed to send response.');
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">Loading...</div>;
  }

  if (!session || session.user.role !== 'SHOPKEEPER') {
    return null; // Should redirect
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Shopkeeper Dashboard, <span className="text-primary-blue">{session.user.email || session.user.name}</span>!
      </h1>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">New Customer Requests</h2>

      {loadingRequests ? (
        <p className="text-center text-gray-600">Loading new requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-600">No new customer requests at the moment. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{request.title}</h3>
              <p className="text-gray-600 mb-4 ">{request.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Posted by: {request.customer.name}</span>
                <span>On: {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Check if shopkeeper has already responded to this post */}
              {request.responses.some(r => r.shopkeeperId === session.user.id) ? (
                <p className="text-center text-sm text-green-600 font-semibold bg-green-50 p-2 rounded-md">
                  You have already responded to this request.
                </p>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <Textarea
                    label="Your Message (optional)"
                    placeholder="e.g., 'We have it in stock!', 'We have a similar item.', 'Will be available next week.'"
                    value={responseMessage[request.id] || ''}
                    onChange={(e) => setResponseMessage(prev => ({ ...prev, [request.id]: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => handleRespondToRequest(request.id, true)}
                    >
                      Yes, Available
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-primary-blue border-primary-blue hover:text-white"
                      onClick={() => handleRespondToRequest(request.id, false)}
                    >
                      Not Available (Send Message)
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}