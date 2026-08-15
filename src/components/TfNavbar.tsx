'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/productos', label: 'Menú' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

/**
 * Header del tema futurista.
 *
 * Existe para dejar de duplicar el mismo <header> a mano en cada página
 * (hoy está repetido en page.tsx, perfil/page.tsx y Navbar.tsx).
 */
export default function TfNavbar() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-cyan-400/15 bg-[#04060f]/85 backdrop-blur-xl py-3'
          : 'border-b border-transparent py-5'
      }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg">
              🍔
              <span className="tf-pulse-ring absolute inset-0 rounded-xl border border-cyan-300/60" />
            </span>
            <span className="tf-gradient-text text-xl font-bold tracking-tight">
              TastyFood
            </span>
          </Link>

          {/* Escritorio */}
          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors ${
                    active ? 'text-cyan-300' : 'text-[#8fa0c4] hover:text-[#e8eefc]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-1.5 left-0 h-px w-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                  )}
                </Link>
              );
            })}

            <Link
              href="/carrito"
              className="relative flex items-center gap-2 text-sm font-medium text-[#8fa0c4] transition-colors hover:text-[#e8eefc]"
            >
              <ShoppingCart size={18} />
              Carrito
              {totalItems > 0 && (
                <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 px-1 text-[11px] font-bold text-[#04060f]">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button className="tf-btn tf-btn-primary !px-4 !py-2 text-sm">
                  Mi Cuenta
                </button>
                {menuOpen && (
                  <div className="tf-glass absolute right-0 top-full w-52 overflow-hidden p-1.5">
                    <Link
                      href="/perfil"
                      className="block rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/calendario"
                      className="block rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                    >
                      Mi Calendario
                    </Link>
                    <Link
                      href="/pedidos"
                      className="block rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                    >
                      Mis Pedidos
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="tf-btn tf-btn-primary !px-4 !py-2 text-sm">
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Móvil */}
          <button
            className="text-[#e8eefc] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="tf-glass mt-4 flex flex-col gap-1 p-3 md:hidden">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/carrito"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
            >
              Carrito {totalItems > 0 && `(${totalItems})`}
            </Link>

            {user ? (
              <>
                <Link
                  href="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                >
                  Mi Perfil
                </Link>
                <Link
                  href="/calendario"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                >
                  Mi Calendario
                </Link>
                <Link
                  href="/pedidos"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-[#e8eefc] transition-colors hover:bg-cyan-400/10"
                >
                  Mis Pedidos
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="tf-btn tf-btn-primary mt-1 text-sm"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
