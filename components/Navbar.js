import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logos/in-or-out-logo.png" alt="In-or-Out Logo" width={48} height={48} priority />
          <span className="sr-only">In-or-Out</span>
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-white hover:text-purple-400">Home</Link>
          <Link href="/about" className="text-white hover:text-purple-400">About</Link>
        </div>
      </div>
    </nav>
  );
}
