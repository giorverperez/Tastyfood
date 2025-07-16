'use client';

import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Clock, Phone, Mail, Facebook, Instagram, Twitter, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { seccionesService, productosService, Seccion, Producto } from '@/lib/database';
import { useCart } from '@/context/CartContext';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePromo, setActivePromo] = useState(0);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<(Producto & { stock_disponible: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { addItem, totalItems, loading: cartLoading } = useCart();

  // Promociones
  const promos = [
    { title: "2x1 en Hamburguesas", desc: "Todos los martes", bgColor: "bg-amber-100" },
    { title: "Envío Gratis", desc: "En pedidos mayores a $20", bgColor: "bg-green-100" },
    { title: "30% de Descuento", desc: "En tu primera compra", bgColor: "bg-blue-100" }
  ];

  // Cargar datos de la base de datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [seccionesData, productosData] = await Promise.all([
          seccionesService.obtenerTodas(),
          productosService.obtenerConStock()
        ]);
        
        setSecciones(seccionesData);
        // Tomar solo los primeros 6 productos para destacados
        setFeaturedProducts(productosData.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleAddToCart = async (producto: Producto & { stock_disponible: number }) => {
    if (cartLoading || addingToCart === producto.id) return;
    
    try {
      setAddingToCart(producto.id);
      await addItem({
          id: producto.id,
          name: producto.nombre,
          price: producto.precio,
          quantity: 1
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

  // Efecto de scroll para cambiar la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Rotación automática de promociones
    const interval = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promos.length);
    }, 4000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [promos.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de promoción rotatorio */}
      <div className={`w-full py-2 text-center font-medium transition-all duration-500 ${promos[activePromo].bgColor}`}>
        <p className="text-sm md:text-base">
          <span className="font-bold">{promos[activePromo].title}</span> — {promos[activePromo].desc}
        </p>
      </div>

      {/* Header con efecto de scroll */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-2' : 'bg-white/90 py-4'}`}>
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
              <span className="text-3xl">🍔</span>
              <span className={`transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}>TastyFood</span>
            </Link>
            
            {/* Menú de escritorio */}
            <div className="hidden md:flex items-center space-x-8">
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
              <Link
                href="/pedidos"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Mi Cuenta
              </Link>
            </div>
            
            {/* Botón de menú móvil */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="flex flex-col p-4 space-y-4">
                <Link 
                  href="/productos" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Menú
                </Link>
                <Link 
                  href="/nosotros" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Nosotros
                </Link>
                <Link 
                  href="/ubicaciones" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ubicaciones
                </Link>
                <Link 
                  href="/contacto" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contacto
                </Link>
                <Link 
                  href="/carrito" 
                  className="relative flex items-center font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="mr-1" size={18} />
                  Carrito
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  href="/pedidos"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Cuenta
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>
        
      {/* Mensaje de confirmación */}
      {mensaje && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300">
          {mensaje}
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-6 mb-12">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Disfruta la mejor experiencia gastronómica a domicilio
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Platillos preparados con ingredientes frescos y de calidad premium
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/productos"
                className="bg-white text-blue-700 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors font-medium flex items-center justify-center"
              >
                Ver Menú
                <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link
                href="/promociones"
                className="border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-blue-700 transition-colors font-medium"
              >
                Promociones
              </Link>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-400 opacity-20"></div>
          <div className="absolute -left-10 -top-10 w-48 h-48 rounded-full bg-blue-400 opacity-20"></div>
        </section>

        {/* Categorías */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Nuestras Categorías</h2>
            <Link href="/productos" className="text-blue-600 hover:text-blue-800 flex items-center">
              Ver todas
              <ArrowRight className="ml-1" size={16} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 animate-pulse rounded-xl p-6 h-24"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {secciones.map((seccion) => {
                // TODO: Se recomienda agregar campos 'icon' y 'color' a la tabla 'secciones' en la base de datos
                // para una gestión más dinámica y centralizada de la apariencia.
                const icon = '🍽️';
                const color = 'bg-gray-100';
                
                return (
                  <Link 
                    href={`/productos?seccion=${seccion.id}`}
                    key={seccion.id}
                    className={`${color} rounded-xl p-6 text-center transition-transform hover:scale-105`}
                  >
                    <span className="text-4xl mb-2 block">{icon}</span>
                    <h3 className="font-medium text-lg">{seccion.nombre}</h3>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Productos Destacados */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Productos Destacados</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {product.imagen_url ? (
                      <img 
                        src={product.imagen_url} 
                        alt={product.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl opacity-50">🍽️</span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-medium text-blue-600 uppercase">{product.seccion?.nombre}</span>
                    <h3 className="font-bold text-lg mt-1">{product.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.descripcion || 'Delicioso platillo preparado con ingredientes frescos'}</p>
                    <div className="flex items-center mt-2">
                      <Star className="text-yellow-500 fill-yellow-500" size={16} />
                      <span className="ml-1 text-sm text-gray-600">4.5</span>
                      <span className="ml-2 text-xs text-gray-500">Stock: {product.stock_disponible}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-bold text-lg text-green-600">₡{product.precio.toLocaleString()}</span>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_disponible === 0 || addingToCart === product.id || cartLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {addingToCart === product.id ? 'Agregando...' : product.stock_disponible > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Beneficios */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">¿Por qué elegirnos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Calidad Premium</h3>
              <p className="text-gray-600">Seleccionamos los ingredientes más frescos para ofrecerte el mejor sabor en cada platillo.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Entrega Rápida</h3>
              <p className="text-gray-600">Garantizamos que tu pedido llegará en el menor tiempo posible y en las mejores condiciones.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Atención Personalizada</h3>
              <p className="text-gray-600">Nuestro equipo de atención al cliente está disponible para asistirte en todo momento.</p>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Lo que dicen nuestros clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                </div>
              </div>
              <p className="text-gray-600 mb-4">El gallo pinto está delicioso, me recuerda a la comida de mi abuela. La entrega fue súper rápida.</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">MC</span>
                </div>
                <div>
                  <p className="font-semibold">María Castillo</p>
                  <p className="text-sm text-gray-500">San José</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Las hamburguesas están increíbles y el servicio al cliente es excelente. Definitivamente volveré a pedir.</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">JR</span>
                </div>
                <div>
                  <p className="font-semibold">José Rodríguez</p>
                  <p className="text-sm text-gray-500">Cartago</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                  <Star className="fill-yellow-500" size={16} />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Pedí un casado completo y llegó caliente y fresco. Los precios son muy justos para la calidad que ofrecen.</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">AS</span>
                </div>
                <div>
                  <p className="font-semibold">Ana Solís</p>
                  <p className="text-sm text-gray-500">Heredia</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-100 rounded-xl p-8 mb-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Listo para probar nuestros deliciosos platillos?</h2>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Haz tu pedido ahora y disfruta de la mejor experiencia gastronómica desde la comodidad de tu hogar
          </p>
          <Link
            href="/productos"
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium inline-block"
          >
            Ordenar Ahora
          </Link>
        </section>
      </main>

      {/* Footer mejorado */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-3xl">🍔</span>
                <span className="text-2xl font-bold">TastyFood</span>
              </div>
              <p className="text-gray-400 mb-4">
                Llevando los sabores auténticos de Manabí a tu mesa desde 2010.
              </p>
              <div className="flex space-x-4 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li><Link href="/productos" className="text-gray-400 hover:text-white transition-colors">Menú</Link></li>
                <li><Link href="/nosotros" className="text-gray-400 hover:text-white transition-colors">Nosotros</Link></li>
                <li><Link href="/promociones" className="text-gray-400 hover:text-white transition-colors">Promociones</Link></li>
                <li><Link href="/ubicaciones" className="text-gray-400 hover:text-white transition-colors">Ubicaciones</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Horario</h3>
              <ul className="space-y-1 text-gray-400">
                <li className="flex justify-start gap-4">
                  <span>Lunes - Viernes:</span>
                  <span>7:00 - 16:00</span>
                </li>
                
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Contacto</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <Phone size={16} className="mr-2 mt-1 flex-shrink-0" />
                  <span>+506 2222-3333</span>
                </li>
                <li className="flex items-start">
                  <Mail size={16} className="mr-2 mt-1 flex-shrink-0" />
                  <span>pedidos@tastyfood.cr</span>
                </li>
                <li className="flex items-start">
                  <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>ULEAM, Manta</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} TastyFood. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}