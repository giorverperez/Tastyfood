'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Clock, ShoppingCart, Sparkles, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { seccionesService, productosService, Seccion, Producto } from '@/lib/database';
import { useCart } from '@/context/CartContext';
import TfNavbar from '@/components/TfNavbar';
import TfFooter from '@/components/TfFooter';

const PROMOS = [
  { title: '2x1 en Hamburguesas', desc: 'Todos los martes' },
  { title: 'Envío Gratis', desc: 'En pedidos mayores a $20' },
  { title: '30% de Descuento', desc: 'En tu primera compra' },
];

const BENEFICIOS = [
  {
    Icon: Star,
    title: 'Calidad Premium',
    text: 'Seleccionamos los ingredientes más frescos para ofrecerte el mejor sabor en cada platillo.',
  },
  {
    Icon: Zap,
    title: 'Stock en Vivo',
    text: 'El menú se actualiza al instante: lo que ves disponible, está disponible de verdad.',
  },
  {
    Icon: Clock,
    title: 'Entrega Rápida',
    text: 'Tu pedido queda listo en el menor tiempo posible y en las mejores condiciones.',
  },
];

const TESTIMONIOS = [
  {
    text: 'El gallo pinto está delicioso, me recuerda a la comida de mi abuela. La entrega fue súper rápida.',
    name: 'María Castillo',
    city: 'San José',
    initials: 'MC',
  },
  {
    text: 'Las hamburguesas están increíbles y el servicio al cliente es excelente. Definitivamente volveré a pedir.',
    name: 'José Rodríguez',
    city: 'Cartago',
    initials: 'JR',
  },
  {
    text: 'Pedí un casado completo y llegó caliente y fresco. Los precios son muy justos para la calidad que ofrecen.',
    name: 'Ana Solís',
    city: 'Heredia',
    initials: 'AS',
  },
];

export default function Home() {
  const [activePromo, setActivePromo] = useState(0);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<
    (Producto & { stock_disponible: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { addItem, loading: cartLoading } = useCart();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [seccionesData, productosData] = await Promise.all([
          seccionesService.obtenerTodas(),
          productosService.obtenerConStock(),
        ]);

        setSecciones(seccionesData);
        setFeaturedProducts(productosData.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setActivePromo((prev) => (prev + 1) % PROMOS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = async (producto: Producto & { stock_disponible: number }) => {
    if (cartLoading || addingToCart === producto.id) return;

    try {
      setAddingToCart(producto.id);
      await addItem({
        id: producto.id,
        name: producto.nombre,
        price: producto.precio,
        quantity: 1,
      });
      setMensaje(`${producto.nombre} agregado al carrito`);
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      setMensaje('Error al agregar al carrito');
      setTimeout(() => setMensaje(null), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="tf-canvas min-h-screen">
      {/* Banda de promociones */}
      <div className="border-b border-cyan-400/15 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-amber-400/10 py-2.5 text-center">
        <p className="text-sm text-[#8fa0c4]">
          <Sparkles size={13} className="mr-2 inline text-cyan-300" />
          <span className="font-semibold text-[#e8eefc]">
            {PROMOS[activePromo].title}
          </span>{' '}
          — {PROMOS[activePromo].desc}
        </p>
      </div>

      <TfNavbar />

      {/* Aviso flotante */}
      {mensaje && (
        <div className="tf-glass tf-glow-cyan fixed right-4 top-24 z-50 px-5 py-3 text-sm text-[#e8eefc]">
          {mensaje}
        </div>
      )}

      <main className="container mx-auto px-4">
        {/* Portada */}
        <section className="relative py-20 text-center md:py-28">
          <span className="tf-glass inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cyan-300">
            <Zap size={13} />
            Pedidos en tiempo real
          </span>

          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Disfruta la mejor experiencia{' '}
            <span className="tf-gradient-text tf-sweep">gastronómica</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#8fa0c4]">
            Platillos preparados con ingredientes frescos y de calidad premium.
            Pide en segundos y recibe tu comprobante al instante.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/productos" className="tf-btn tf-btn-primary">
              Ver Menú
              <ArrowRight size={17} />
            </Link>
            <Link href="/nosotros" className="tf-btn tf-btn-ghost">
              Conócenos
            </Link>
          </div>
        </section>

        {/* Categorías */}
        <section className="pb-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">Nuestras Categorías</h2>
            <Link
              href="/productos"
              className="flex items-center gap-1.5 text-sm text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Ver todas
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="tf-glass h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {secciones.map((seccion) => (
                <Link
                  href={`/productos?seccion=${seccion.id}`}
                  key={seccion.id}
                  className="tf-glass tf-glass-edge group p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <span className="mb-3 block text-4xl transition-transform duration-300 group-hover:scale-110">
                    🍽️
                  </span>
                  <h3 className="font-medium capitalize text-[#e8eefc]">
                    {seccion.nombre}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Destacados */}
        <section className="pb-20">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">Productos Destacados</h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="tf-glass h-96 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="tf-glass p-12 text-center">
              <p className="text-[#8fa0c4]">
                Todavía no hay productos con stock cargado para hoy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => {
                const agotado = product.stock_disponible === 0;

                return (
                  <div
                    key={product.id}
                    className="tf-glass tf-glass-edge group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/35"
                  >
                    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0e1530] to-[#04060f]">
                      {product.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-6xl opacity-30">🍽️</span>
                      )}

                      <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${
                          agotado
                            ? 'bg-rose-500/20 text-rose-200'
                            : 'bg-lime-400/20 text-lime-200'
                        }`}
                      >
                        {agotado ? 'Sin stock' : `${product.stock_disponible} disponibles`}
                      </span>
                    </div>

                    <div className="p-5">
                      <span className="text-xs font-medium uppercase tracking-wider text-cyan-300">
                        {product.seccion?.nombre}
                      </span>
                      <h3 className="mt-1.5 text-lg font-bold text-[#e8eefc]">
                        {product.nombre}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-[#8fa0c4]">
                        {product.descripcion ||
                          'Delicioso platillo preparado con ingredientes frescos'}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-xl font-bold text-[#e8eefc]">
                          ${product.precio.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={agotado || addingToCart === product.id || cartLoading}
                          className="tf-btn tf-btn-primary !px-4 !py-2 text-sm"
                        >
                          {addingToCart === product.id
                            ? 'Agregando...'
                            : agotado
                              ? 'Sin Stock'
                              : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Beneficios */}
        <section className="pb-20">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {BENEFICIOS.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="tf-glass tf-glass-edge p-7 text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                  <Icon size={24} />
                </span>
                <h3 className="mb-2.5 text-lg font-semibold text-[#e8eefc]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#8fa0c4]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonios */}
        <section className="pb-20">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIOS.map((t) => (
              <div key={t.name} className="tf-glass p-6">
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-[#8fa0c4]">{t.text}</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-500/25 text-sm font-semibold text-cyan-200">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#e8eefc]">{t.name}</p>
                    <p className="text-xs text-[#5b6b8f]">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Llamada final */}
        <section>
          <div className="tf-glass tf-glass-edge tf-glow-violet p-10 text-center md:p-16">
            <h2 className="mx-auto mb-4 max-w-2xl text-2xl font-bold md:text-4xl">
              ¿Listo para probar nuestros{' '}
              <span className="tf-gradient-text">deliciosos platillos</span>?
            </h2>
            <p className="mx-auto mb-9 max-w-xl text-[#8fa0c4]">
              Haz tu pedido ahora y disfruta de la mejor experiencia gastronómica
              desde la comodidad de tu hogar.
            </p>
            <Link href="/productos" className="tf-btn tf-btn-primary">
              <ShoppingCart size={17} />
              Ordenar Ahora
            </Link>
          </div>
        </section>
      </main>

      <TfFooter />
    </div>
  );
}
