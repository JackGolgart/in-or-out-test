// components/Layout.js
import Head from 'next/head';

export default function Layout({ children, title = 'InOrOut' }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{title}</title>
      </Head>

      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-300">🏀 InOrOut</h1>
        <div className="space-x-4">
          <a href="/" className="hover:text-purple-400">Home</a>
          <a href="/portfolio" className="hover:text-purple-400">Portfolio</a>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
