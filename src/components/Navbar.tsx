'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  return (
    <header className="bg-white shadow-lg py-4">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
            <span className="text-3xl">🍔</span>
            <span>TastyFood</span>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link href="/productos" className="font-medium hover:text-blue-600 transition-colors">
              Menú
            </Link>
            <Link href="/nosotros" className="font-medium hover:text-blue-600 transition-colors">
              Nosotros
            </Link>
            <Link href="/ubicaciones" className="font-medium hover:text-blue-600 transition-colors">
              Ubicaciones
            </Link>
            <Link href="/contacto" className="font-medium hover:text-blue-600 transition-colors">
              Contacto
            </Link>
            <Link href="/carrito" className="relative flex items-center font-medium hover:text-blue-600 transition-colors">
              <ShoppingCart className="mr-1" size={18} />
              Carrito
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <div 
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1">
                  Mi Cuenta
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full w-48 bg-transparent rounded-md shadow-lg z-10">
                    <Link href="/perfil" className="block bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mi Perfil
                    </Link>
                    <Link href="/pedidos" className="block bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mis Pedidos
                    </Link>
                    <button 
                       onClick={async () => {
                         await signOut();
                         router.push('/');
                       }}
                       className="block bg-red-600 w-full text-left px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors rounded-b-lg"
                     >
                       Cerrar Sesión
                     </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}