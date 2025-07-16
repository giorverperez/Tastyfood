'use client';

import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { facturasService, ProductoCarrito } from '@/lib/database';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, verificarDisponibilidad, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    const result = await updateQuantity(itemId, newQuantity);
    if (!result.success && result.message) {
      setOrderMessage(result.message);
      setTimeout(() => setOrderMessage(null), 3000);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setProcessingOrder(true);
    setOrderMessage(null);

    try {
      // Verificar disponibilidad antes de procesar
      const verificacion = await verificarDisponibilidad();
      if (!verificacion.disponible) {
        setOrderMessage(verificacion.mensaje || 'Algunos productos no están disponibles');
        return;
      }

      // Preparar productos para la factura
      const productos: ProductoCarrito[] = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        producto_id: item.id,
        cantidad: item.quantity
      }));

      // Crear factura
      const resultado = await facturasService.crear({
        cliente_id: user.id,
        productos,
        metodo_pago: metodoPago,
        notas: 'Pedido realizado desde la aplicación web'
      });

      if (resultado.success) {
        setOrderMessage(`¡Pedido creado exitosamente! Número de factura: ${resultado.numero_factura}`);
        clearCart();
        
        // Redirigir a pedidos después de 3 segundos
        setTimeout(() => {
          router.push('/pedidos');
        }, 3000);
      } else {
        setOrderMessage(resultado.message || 'Error al procesar el pedido');
      }
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      setOrderMessage('Error al procesar el pedido. Por favor, intenta de nuevo.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>
        
        {/* Mensaje de estado */}
        {orderMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            orderMessage.includes('Error') || orderMessage.includes('insuficiente') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {orderMessage}
          </div>
        )}
        
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">Tu carrito está vacío</p>
            <button 
              onClick={() => router.push('/productos')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Items del carrito */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b py-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-gray-600">${item.price.toFixed(2)} c/u</p>
                      {item.stockDisponible !== undefined && (
                        <p className="text-sm text-gray-500">Disponible hoy: {item.stockDisponible}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <button
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={cartLoading}
                        >
                          -
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button
                          className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={cartLoading || (item.stockDisponible !== undefined && item.quantity >= item.stockDisponible)}
                          title={item.quantity >= (item.stockDisponible || 0) ? 'Stock máximo para hoy alcanzado' : ''}
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Método de Pago</h3>
              <div className="flex gap-4">
                {(['efectivo', 'tarjeta', 'transferencia'] as const).map(metodo => (
                  <label key={metodo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoPago"
                      value={metodo}
                      checked={metodoPago === metodo}
                      onChange={(e) => setMetodoPago(e.target.value as typeof metodoPago)}
                      className="text-blue-600"
                    />
                    <span className="capitalize">{metodo}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Total y checkout */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
              
              {user ? (
                <button 
                  onClick={handleCheckout}
                  disabled={processingOrder || cartLoading}
                  className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors ${
                    processingOrder || cartLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {processingOrder ? 'Procesando Pedido...' : 'Proceder al Pago'}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Inicia sesión para continuar con tu pedido</p>
                  <button 
                    onClick={() => router.push('/login')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}