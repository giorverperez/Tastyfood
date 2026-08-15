'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Plus, Search } from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { Producto } from '@/lib/database';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [selectedSeccion, setSelectedSeccion] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const { addItem, loading: cartLoading } = useCart();
  const { productos, secciones, loading, error } = useProducts();
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // La home enlaza a /productos?seccion=X, pero el parámetro no se leía nunca:
  // pulsar una categoría en el inicio abría el menú completo sin filtrar.
  useEffect(() => {
    const seccion = searchParams.get('seccion');
    setSelectedSeccion(seccion ? Number(seccion) : null);
  }, [searchParams]);

  const filteredProducts = productos
    .filter((p) => selectedSeccion === null || p.seccion_id === selectedSeccion)
    .filter((p) =>
      busqueda.trim() === ''
        ? true
        : p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
    );

  const handleAddToCart = async (producto: Producto & { stock_disponible: number }) => {
    setAddingToCart(producto.id);
    setMensaje(null);

    try {
      const result = await addItem({
        id: producto.id,
        name: producto.nombre,
        price: producto.precio,
        quantity: 1,
      });

      setMensaje(
        result.success
          ? `${producto.nombre} agregado al carrito`
          : result.message || 'Error al agregar al carrito'
      );
    } catch {
      setMensaje('Error al agregar al carrito');
    } finally {
      setAddingToCart(null);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="tf-glass h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="tf-glass flex items-center gap-4 p-8">
        <AlertCircle className="shrink-0 text-rose-300" size={22} />
        <p className="text-rose-200">{error}</p>
      </div>
    );
  }

  const esError =
    mensaje?.includes('Error') || mensaje?.includes('insuficiente');

  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold md:text-4xl">
          Nuestro <span className="tf-gradient-text">Menú</span>
        </h1>
        <p className="mt-2.5 text-[#8fa0c4]">
          Disponibilidad actualizada al instante desde la cocina.
        </p>
      </div>

      {mensaje && (
        <div
          role="status"
          className={`mb-7 rounded-xl border px-5 py-3.5 text-sm ${
            esError
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : 'border-lime-400/30 bg-lime-400/10 text-lime-200'
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* Buscador */}
      <div className="relative mb-6 max-w-md">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
        />
        <input
          className="tf-input pl-11"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar un platillo..."
          aria-label="Buscar productos"
        />
      </div>

      {/* Filtros por sección */}
      <div className="mb-10 flex flex-wrap gap-2.5">
        <button
          onClick={() => setSelectedSeccion(null)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selectedSeccion === null
              ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
              : 'border-cyan-400/15 text-[#8fa0c4] hover:border-cyan-400/40 hover:text-[#e8eefc]'
          }`}
        >
          Todos
        </button>
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            onClick={() => setSelectedSeccion(seccion.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all ${
              selectedSeccion === seccion.id
                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                : 'border-cyan-400/15 text-[#8fa0c4] hover:border-cyan-400/40 hover:text-[#e8eefc]'
            }`}
          >
            {seccion.nombre}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="tf-glass p-14 text-center">
          <p className="text-[#8fa0c4]">
            {busqueda
              ? `No encontramos nada para “${busqueda}”.`
              : 'No hay productos disponibles en esta sección.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((producto) => {
            const agotado = producto.stock_disponible === 0;

            return (
              <div
                key={producto.id}
                className="tf-glass tf-glass-edge group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/35"
              >
                <Link
                  href={`/productos/${producto.id}`}
                  className="relative block h-48 overflow-hidden bg-gradient-to-br from-[#0e1530] to-[#04060f]"
                >
                  {producto.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-6xl opacity-30">
                      🍽️
                    </span>
                  )}

                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${
                      agotado
                        ? 'bg-rose-500/20 text-rose-200'
                        : 'bg-lime-400/20 text-lime-200'
                    }`}
                  >
                    {agotado ? 'Sin stock hoy' : `${producto.stock_disponible} hoy`}
                  </span>
                </Link>

                <div className="p-5">
                  <Link href={`/productos/${producto.id}`}>
                    <h3 className="text-lg font-bold text-[#e8eefc] transition-colors hover:text-cyan-300">
                      {producto.nombre}
                    </h3>
                  </Link>
                  <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-[#8fa0c4]">
                    {producto.descripcion}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xl font-bold text-[#e8eefc]">
                      ${producto.precio}
                    </span>
                    <button
                      onClick={() => handleAddToCart(producto)}
                      disabled={agotado || addingToCart === producto.id || cartLoading}
                      className="tf-btn tf-btn-primary !px-4 !py-2 text-sm"
                    >
                      {addingToCart === producto.id ? (
                        'Agregando...'
                      ) : agotado ? (
                        'Sin Stock'
                      ) : (
                        <>
                          <Plus size={15} />
                          Agregar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <TfLayout>
      {/* useSearchParams necesita un límite de Suspense para no bloquear
          la generación estática de la página. */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="tf-glass h-96 animate-pulse" />
            ))}
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </TfLayout>
  );
}
