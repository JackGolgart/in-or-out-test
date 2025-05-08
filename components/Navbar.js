import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-purple-400 font-bold text-xl">NBA Picks</Link>
        <div className="space-x-4">
          <Link href="/" className="text-white hover:text-purple-400">Home</Link>
          <Link href="/about" className="text-white hover:text-purple-400">About</Link>
        </div>
      </div>
    </nav>
  );
}
