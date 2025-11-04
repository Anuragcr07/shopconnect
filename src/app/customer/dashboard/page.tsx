// src/app/(customer)/dashboard/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import MapComponent from  '@/components/MapComponents';

interface ShopkeeperInfo {
  id: string;
  name: string;
  shopName: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface ShopRequest {
  id: string;
  isAvailable: boolean;
  message: string;
  shopkeeper: ShopkeeperInfo;
}

interface CustomerPost {
  id: string;
  title: string;
  description: string;
  status: string; // "OPEN", "FULFILLED", "CLOSED"
  createdAt: string;
  responses: ShopRequest[];
}

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<CustomerPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMarkers, setMapMarkers] = useState<
    { lat: number; lng: number; title: string; shopId: string }[]
  >([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'CUSTOMER') {
      redirect('/shopkeeper/dashboard');
    }
    if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
      fetchCustomerPosts();
    }
  }, [status, session]);

  const fetchCustomerPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch('/api/customer/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch customer posts');
      }
      const data: CustomerPost[] = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching customer posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleViewShopOnMap = (shopkeeper: ShopkeeperInfo) => {
    if (shopkeeper.latitude && shopkeeper.longitude) {
      setMapCenter({ lat: shopkeeper.latitude, lng: shopkeeper.longitude });
      setMapMarkers([{
        lat: shopkeeper.latitude,
        lng: shopkeeper.longitude,
        title: shopkeeper.shopName || shopkeeper.name || "Shop",
        shopId: shopkeeper.id,
      }]);
      setShowMap(true);
    }
  };

  const handleFulfillPost = async (postId: string) => {
    if (!confirm("Are you sure you want to mark this post as fulfilled?")) return;
    try {
      const response = await fetch(`/api/customer/posts/${postId}/fulfill`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to fulfill post');
      }
      // Re-fetch posts to update the UI
      fetchCustomerPosts();
    } catch (error) {
      console.error('Error fulfilling post:', error);
      alert('Failed to fulfill post.');
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">Loading...</div>;
  }

  if (!session || session.user.role !== 'CUSTOMER') {
    return null; // Should redirect by useEffect
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Welcome, <span className="text-primary-blue">{session.user.name}</span>!
      </h1>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Requirements</h2>
        <Link href="/customer/posts/create">
          <Button className='text-black'>Post New Requirement</Button>
        </Link>
      </div>

      {loadingPosts ? (
        <p className="text-center text-gray-600">Loading your posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-600">You haven't posted any requirements yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4 ">{post.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  post.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                  post.status === 'FULFILLED' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.status}
                </span>
              </div>

              {post.responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-2">Shop Responses:</h4>
                  {post.responses.map((response) => (
                    <div key={response.id} className="bg-gray-50 p-3 rounded-lg mb-2 shadow-sm">
                      <p className="font-medium text-gray-800">
                        {response.shopkeeper.shopName || response.shopkeeper.name}
                        {response.isAvailable && <span className="text-green-600 ml-2">(Available!)</span>}
                      </p>
                      {response.message && <p className="text-sm text-gray-600 italic mt-1">"{response.message}"</p>}
                      <div className="text-sm text-gray-700 mt-2 space-y-1">
                        <p>Address: {response.shopkeeper.address}</p>
                        <p>Phone: {response.shopkeeper.phone}</p>
                      </div>
                      {response.shopkeeper.latitude && response.shopkeeper.longitude && (
                        <Button
                          variant="outline"
                          
                          className="mt-3 text-sm px-4 py-2"
                          onClick={() => handleViewShopOnMap(response.shopkeeper)}
                        >
                          View on Map
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {post.status === 'OPEN' && post.responses.length > 0 && (
                <Button
                  onClick={() => handleFulfillPost(post.id)}
                  className="mt-4 w-full text-black"
                  variant="primary"
                >
                  Mark as Fulfilled
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {showMap && mapCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl h-3/4 flex flex-col relative">
            <h3 className="text-xl font-bold mb-4">Shop Location</h3>
            <div className=" rounded-lg overflow-hidden">
              <MapComponent center={mapCenter} markers={mapMarkers} />
            </div>
            <Button
              variant="outline"
              className="absolute top-4 right-4 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-600"
              onClick={() => setShowMap(false)}
            >
              Close Map
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}