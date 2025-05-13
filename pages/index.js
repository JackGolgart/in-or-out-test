'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { trackComponentRender } from '../utils/performance';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [renderStart] = useState(Date.now());

  useEffect(() => {
    return () => {
      trackComponentRender('HomePage', Date.now() - renderStart);
    };
  }, [renderStart]);

  useEffect(() => {
    if (query.length > 0 && query.length < 3) {
      setSearchMessage('Type at least 3 characters to search');
    } else {
      setSearchMessage('');
    }

    const delay = setTimeout(() => {
      if (query.length >= 3) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query, router]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Pick Your Players
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-12">
                Search NBA players and track top picks!
              </p>
              
              {/* Search Section */}
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search players by name..."
                      className="input-primary h-12"
                    />
                  </div>
                </div>
                {searchMessage && (
                  <p className="mt-2 text-sm text-gray-400">{searchMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}