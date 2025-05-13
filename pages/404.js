import Link from 'next/link';
import Layout from '../components/Layout';

export default function Custom404() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Return Home
          </Link>
        </div>
      </div>
    </Layout>
  );
} 