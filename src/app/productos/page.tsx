'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { Producto } from '@/lib/database';

export default function ProductsPage() {
  const [selectedSeccion, setSelectedSeccion] = useState<number | null>(null);
  const { addItem, loading: cartLoading } = useCart();
  const { productos, secciones, loading, error } = useProducts();
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const filteredProducts = selectedSeccion === null
    ? productos
    : productos.filter(producto => producto.seccion_id === selectedSeccion);

  const handleAddToCart = async (producto: Producto & { stock_disponible: number }) => {
    setAddingToCart(producto.id);
    setMensaje(null);
    
    try {
      const result = await addItem({
        id: producto.id,
        name: producto.nombre,
        price: producto.precio,
        quantity: 1
      });
      
      if (result.success) {
        setMensaje(`${producto.nombre} agregado al carrito`);
      } else {
        setMensaje(result.message || 'Error al agregar al carrito');
      }
    } catch  {
      setMensaje('Error al agregar al carrito');
    } finally {
      setAddingToCart(null);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Nuestro Menú</h1>
        
        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.includes('Error') || mensaje.includes('insuficiente') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {mensaje}
          </div>
        )}
        
        {/* Filtros de sección */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setSelectedSeccion(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSeccion === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          {secciones.map(seccion => (
            <button
              key={seccion.id}
              onClick={() => setSelectedSeccion(seccion.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSeccion === seccion.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {seccion.nombre}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(producto => (
            <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={producto.imagen_url || '/placeholder-food.jpg'}
                alt={producto.nombre}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-food.jpg';
                }}
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{producto.nombre}</h3>
                <p className="text-gray-600 mb-2">{producto.descripcion}</p>
                <div className="mb-4">
                  <span className={`text-sm px-2 py-1 rounded ${
                    producto.stock_disponible > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.stock_disponible > 0 
                      ? `Disponible hoy: ${producto.stock_disponible}` 
                      : 'Sin stock hoy'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    ${producto.precio}
                  </span>
                  <button
                    onClick={() => handleAddToCart(producto)}
                    disabled={producto.stock_disponible === 0 || addingToCart === producto.id || cartLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      producto.stock_disponible === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : addingToCart === producto.id
                        ? 'bg-orange-400 text-white cursor-wait'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {addingToCart === producto.id
                      ? 'Agregando...'
                      : producto.stock_disponible === 0
                      ? 'Sin Stock'
                      : 'Agregar al Carrito'
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay productos disponibles en esta sección.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}