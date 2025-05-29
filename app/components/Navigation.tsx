'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();

  // Determine which links to show based on the current route
  const isCapexPage = pathname === '/capex';
  const isManagerPage = pathname === '/manager';

  return (
    <nav style={{ backgroundColor: '#0066a1' }} className="shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Image src="/marico-icon.png" alt="Marico Logo" width={40} height={40} className="mr-6" />
            <Link 
              href="/"
              className={`text-white hover:text-gray-200 ${
                pathname === '/' ? 'font-semibold underline' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              href="/capex"
              className={`text-white hover:text-gray-200 ${
                pathname === '/capex' ? 'font-semibold underline' : ''
              }`}
            >
              CAPEX Approval
            </Link>
            {isManagerPage && (
              <Link 
                href="/manager"
                className={`text-white hover:text-gray-200 ${
                  pathname === '/manager' ? 'font-semibold underline' : ''
                }`}
              >
                Manager Dashboard
              </Link>
            )}
            <Link 
              href="/cio"
              className={`text-gray-700 hover:text-gray-900 ${
                pathname === '/cio' ? 'font-semibold' : ''
              }`}
            >
              CIO Dashboard
            </Link>
            <Link 
              href="/cfo"
              className={`text-gray-700 hover:text-gray-900 ${
                pathname === '/cfo' ? 'font-semibold' : ''
              }`}
            >
              CFO Dashboard
            </Link>
            <Link 
              href="/bookings"
              className={`text-gray-700 hover:text-gray-900 ${
                pathname === '/bookings' ? 'font-semibold' : ''
              }`}
            >
              View Bookings
            </Link>
            <Link 
              href="/requests"
              className={`text-white hover:text-gray-200 ${
                pathname === '/requests' ? 'font-semibold underline' : ''
              }`}
            >
              View Requests
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 