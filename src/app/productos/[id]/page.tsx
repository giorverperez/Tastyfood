'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useCart } from '@/context/CartContext';
import { productosService, type Producto } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';

interface ProductoDetallado extends Producto {
  stock_disponible: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addItem, loading: cartLoading } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductoDetallado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await productosService.obtenerPorId(parseInt(productId));

        if (!productData) {
          setError('Producto no encontrado');
          return;
        }

        const productoConStock = await productosService.obtenerPorIdConStock(
          productData.id
        );

        setProduct({
          ...productData,
          stock_disponible: productoConStock?.stock_disponible ?? 0,
        });
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      // Antes apuntaba a '/auth/login', una ruta que no existe en este
      // proyecto: el enlace daba 404 en vez de llevar al inicio de sesión.
      router.push('/login');
      return;
    }

    if (product.stock_disponible < quantity) {
      setMensaje('No hay suficiente stock disponible');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    try {
      setAgregando(true);
      const result = await addItem({
        id: product.id,
        name: product.nombre,
        price: product.precio,
        quantity,
      });

      setMensaje(
        result.success
          ? `${quantity} × ${product.nombre} agregado al carrito`
          : result.message || 'Error al agregar al carrito'
      );
    } catch {
      setMensaje('Error al agregar al carrito');
    } finally {
      setAgregando(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    if (newQuantity >= 1 && newQuantity <= product.stock_disponible) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <TfLayout>
        <div className="tf-glass h-96 animate-pulse" />
      </TfLayout>
    );
  }

  if (error || !product) {
    return (
      <TfLayout>
        <div className="tf-glass p-14 text-center">
          <h1 className="mb-6 text-2xl font-bold">
            {error || 'Producto no encontrado'}
          </h1>
          <Link href="/productos" className="tf-btn tf-btn-primary">
            <ArrowLeft size={16} />
            Volver al menú
          </Link>
        </div>
      </TfLayout>
    );
  }

  const agotado = product.stock_disponible === 0;
  const esError =
    mensaje?.includes('Error') || mensaje?.includes('suficiente');

  return (
    <TfLayout>
      <Link
        href="/productos"
        className="mb-7 inline-flex items-center gap-2 text-sm text-[#8fa0c4] transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={15} />
        Volver al menú
      </Link>

      {mensaje && (
        <div
          role="status"
          className={`mb-6 rounded-xl border px-5 py-3.5 text-sm ${
            esError
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : 'border-lime-400/30 bg-lime-400/10 text-lime-200'
          }`}
        >
          {mensaje}
        </div>
      )}

      <div className="tf-glass tf-glass-edge overflow-hidden md:flex">
        <div className="relative h-72 shrink-0 bg-gradient-to-br from-[#0e1530] to-[#04060f] md:h-auto md:w-2/5">
          {product.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-7xl opacity-30">
              🍽️
            </span>
          )}

          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
              agotado ? 'bg-rose-500/20 text-rose-200' : 'bg-lime-400/20 text-lime-200'
            }`}
          >
            {agotado
              ? 'Sin stock para hoy'
              : `Disponible hoy: ${product.stock_disponible}`}
          </span>
        </div>

        <div className="flex-1 p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            {product.seccion?.nombre || 'Producto'}
          </span>
          <h1 className="mt-2.5 text-3xl font-bold md:text-4xl">{product.nombre}</h1>
          <p className="mt-4 leading-relaxed text-[#8fa0c4]">{product.descripcion}</p>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-5">
            <span className="text-3xl font-bold text-[#e8eefc]">
              ${product.precio.toFixed(2)}
            </span>

            {!agotado && (
              <div className="flex items-center gap-1 rounded-xl border border-cyan-400/20 p-1">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  aria-label="Reducir cantidad"
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center font-semibold text-[#e8eefc]">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock_disponible}
                  aria-label="Aumentar cantidad"
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={agotado || agregando || cartLoading}
            className="tf-btn tf-btn-primary mt-8 w-full"
          >
            <ShoppingCart size={17} />
            {agregando
              ? 'Agregando...'
              : !user
                ? 'Iniciar sesión para comprar'
                : agotado
                  ? 'Sin stock para hoy'
                  : `Agregar ${quantity} al carrito`}
          </button>
        </div>
      </div>
    </TfLayout>
  );
}
