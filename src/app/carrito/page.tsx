'use client';

import Layout from '@/components/Layout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { facturasService, ProductoCarrito } from '@/lib/database';
import QRCode from 'qrcode';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, verificarDisponibilidad, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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
        metodo_pago: 'efectivo',
        notas: 'Pedido realizado desde la aplicación web'
      });

      if (resultado.success) {
        // Generar QR con información del pedido
        const qrData = JSON.stringify({
          numero_factura: resultado.numero_factura,
          total: resultado.total,
          fecha: new Date().toISOString(),
          cliente_id: user.id
        });
        
        const qrUrl = await QRCode.toDataURL(qrData);
        setQrCodeUrl(qrUrl);
        setShowQR(true);
        setOrderMessage(`¡Pedido creado exitosamente! Número de factura: ${resultado.numero_factura}`);
        clearCart();
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
        
        {/* Modal QR Code */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-green-600">¡Pedido Confirmado!</h2>
                <p className="text-gray-600 mb-6">
                  Tu pedido ha sido reservado. Presenta este código QR al momento de recoger tu pedido.
                </p>
                
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                  <img 
                    src={qrCodeUrl} 
                    alt="Código QR del pedido" 
                    className="mx-auto w-48 h-48"
                  />
                </div>
                
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Total a pagar:</strong> ${totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Método de pago:</strong> Efectivo
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowQR(false);
                      router.push('/pedidos');
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver Mis Pedidos
                  </button>
                  <button
                    onClick={() => {
                      setShowQR(false);
                      router.push('/productos');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Seguir Comprando
                  </button>
                </div>
              </div>
            </div>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">Pago en Efectivo</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  El pago se realizará en efectivo al momento de recoger tu pedido.
                </p>
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