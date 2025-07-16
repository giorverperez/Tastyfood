'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { productosService, type Producto } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';

interface ProductoDetallado extends Producto {
  imagen_url?: string;
  stock_disponible?: number;
}



export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addItem } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<ProductoDetallado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await productosService.obtenerPorId(parseInt(productId));
        
        if (!productData) {
          setError('Producto no encontrado');
          return;
        }

        // Usar la función que obtiene producto con stock
        const productoConStock = await productosService.obtenerPorIdConStock(productData.id);
        
        setProduct({
          ...productData,
          imagen_url: productData.imagen_url || '/api/placeholder/400/300',
          stock_disponible: productoConStock?.stock_disponible || 0
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Producto no encontrado'}
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (product.stock_disponible && product.stock_disponible < quantity) {
      alert('No hay suficiente stock disponible');
      return;
    }

    addItem({
      id: product.id,
      name: product.nombre,
      price: product.precio,
      quantity: quantity
    });

    alert('Producto agregado al carrito');
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && (!product.stock_disponible || newQuantity <= product.stock_disponible)) {
      setQuantity(newQuantity);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <div className="h-64 w-full md:w-96 bg-gray-300 relative">
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/400/300';
                  }}
                />
              </div>
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">
                {product.seccion?.nombre || 'Producto'}
              </div>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.nombre}</h1>
              <p className="mt-4 text-gray-600">{product.descripcion}</p>
              
              {product.stock_disponible !== undefined && (
                <div className="mt-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                    product.stock_disponible > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock_disponible > 0 
                      ? `Disponible hoy: ${product.stock_disponible}` 
                      : 'Sin stock para hoy'
                    }
                  </span>
                </div>
              )}
              
              {/* Información adicional del producto se puede agregar aquí cuando esté disponible en la BD */}

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ${product.precio.toFixed(2)}
                  </span>
                  
                  {product.stock_disponible && product.stock_disponible > 0 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-x">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          disabled={product.stock_disponible ? quantity >= product.stock_disponible : false}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Volver
                  </button>
                  
                  <button
                      onClick={handleAddToCart}
                      disabled={!product.stock_disponible || product.stock_disponible === 0}
                      className={`px-6 py-3 rounded-md transition-colors ${
                        product.stock_disponible && product.stock_disponible > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!user ? 'Iniciar Sesión para Comprar' : 
                       (!product.stock_disponible || product.stock_disponible === 0) ? 'Sin stock para hoy' : 
                       `Agregar ${quantity} al carrito`}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}