'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: '/', label: 'Home' },
    { href: '/contract-tester', label: 'Contract Tester' },
    { href: '/gemini-processor', label: 'Gemini Processor' }
  ];
  
  return (
    <nav className="bg-gray-800 text-white py-3 px-6 mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="font-bold text-xl">Avalanche</div>
        <div className="flex space-x-6">
          {links.map(link => (
            <Link 
              key={link.href}
              href={link.href}
              className={`hover:text-blue-300 transition-colors ${pathname === link.href ? 'text-blue-400' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}