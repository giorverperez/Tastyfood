'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Banknote, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { facturasService, ProductoCarrito } from '@/lib/database';
import QRCode from 'qrcode';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    verificarDisponibilidad,
    clearCart,
    loading: cartLoading,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  // El total se congela antes de vaciar el carrito: el modal leía `totalPrice`,
  // que ya valía 0 porque clearCart() se ejecuta antes de mostrarlo, así que
  // el comprobante siempre decía "Total a pagar: $0.00".
  const [totalConfirmado, setTotalConfirmado] = useState(0);
  const [facturaConfirmada, setFacturaConfirmada] = useState<string>('');

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
      const verificacion = await verificarDisponibilidad();
      if (!verificacion.disponible) {
        setOrderMessage(
          verificacion.mensaje || 'Algunos productos no están disponibles'
        );
        return;
      }

      const productos: ProductoCarrito[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        producto_id: item.id,
        cantidad: item.quantity,
      }));

      const totalAlConfirmar = totalPrice;

      const resultado = await facturasService.crear({
        cliente_id: user.id,
        productos,
        metodo_pago: 'efectivo',
        notas: 'Pedido realizado desde la aplicación web',
      });

      if (resultado.success) {
        const qrData = JSON.stringify({
          numero_factura: resultado.numero_factura,
          total: resultado.total,
          fecha: new Date().toISOString(),
          cliente_id: user.id,
        });

        const qrUrl = await QRCode.toDataURL(qrData, {
          margin: 1,
          color: { dark: '#04060f', light: '#ffffff' },
        });

        setQrCodeUrl(qrUrl);
        setTotalConfirmado(resultado.total ?? totalAlConfirmar);
        setFacturaConfirmada(resultado.numero_factura ?? '');
        setShowQR(true);
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

  const esError =
    orderMessage?.includes('Error') || orderMessage?.includes('insuficiente');

  return (
    <TfLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">
          Carrito de <span className="tf-gradient-text">Compras</span>
        </h1>

        {orderMessage && (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-5 py-3.5 text-sm ${
              esError
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-lime-400/30 bg-lime-400/10 text-lime-200'
            }`}
          >
            {orderMessage}
          </div>
        )}

        {/* Confirmación con QR */}
        {showQR && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="tf-glass tf-glass-edge tf-glow-cyan w-full max-w-md p-8 text-center">
              <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-lime-400 text-[#04060f]">
                <CheckCircle2 size={26} />
              </span>

              <h2 className="mb-2.5 text-2xl font-bold">¡Pedido Confirmado!</h2>
              <p className="mb-7 text-sm leading-relaxed text-[#8fa0c4]">
                Presenta este código QR al momento de recoger tu pedido.
              </p>

              <div className="mx-auto mb-7 w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="Código QR del pedido" className="h-48 w-48" />
              </div>

              <div className="mb-7 space-y-2 text-sm">
                {facturaConfirmada && (
                  <p className="text-[#8fa0c4]">
                    Comprobante:{' '}
                    <span className="font-semibold text-[#e8eefc]">
                      {facturaConfirmada}
                    </span>
                  </p>
                )}
                <p className="text-[#8fa0c4]">
                  Total a pagar:{' '}
                  <span className="font-semibold text-[#e8eefc]">
                    ${totalConfirmado.toFixed(2)}
                  </span>
                </p>
                <p className="text-[#8fa0c4]">Método de pago: Efectivo</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setShowQR(false);
                    router.push('/pedidos');
                  }}
                  className="tf-btn tf-btn-primary flex-1"
                >
                  Ver Mis Pedidos
                </button>
                <button
                  onClick={() => {
                    setShowQR(false);
                    router.push('/productos');
                  }}
                  className="tf-btn tf-btn-ghost flex-1"
                >
                  Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="tf-glass p-14 text-center">
            <ShoppingBag className="mx-auto mb-5 text-[#5b6b8f]" size={44} />
            <p className="mb-7 text-lg text-[#8fa0c4]">Tu carrito está vacío</p>
            <Link href="/productos" className="tf-btn tf-btn-primary">
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Productos */}
            <div className="tf-glass tf-glass-edge divide-y divide-cyan-400/10 p-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-40 flex-1">
                    <h3 className="font-semibold text-[#e8eefc]">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-[#8fa0c4]">
                      ${item.price.toFixed(2)} c/u
                    </p>
                    {item.stockDisponible !== undefined && (
                      <p className="mt-0.5 text-xs text-[#5b6b8f]">
                        Disponible hoy: {item.stockDisponible}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-xl border border-cyan-400/20 p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={cartLoading}
                        aria-label="Reducir cantidad"
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#e8eefc]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={
                          cartLoading ||
                          (item.stockDisponible !== undefined &&
                            item.quantity >= item.stockDisponible)
                        }
                        aria-label="Aumentar cantidad"
                        title={
                          item.quantity >= (item.stockDisponible || 0)
                            ? 'Stock máximo para hoy alcanzado'
                            : ''
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="w-20 text-right font-bold text-[#e8eefc]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Eliminar ${item.name}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-rose-300 transition-colors hover:bg-rose-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Método de pago */}
            <div className="tf-glass flex items-start gap-4 p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/15 text-lime-300">
                <Banknote size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-[#e8eefc]">Pago en Efectivo</h3>
                <p className="mt-1 text-sm text-[#8fa0c4]">
                  El pago se realizará al momento de recoger tu pedido.
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="tf-glass tf-glass-edge p-7">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg text-[#8fa0c4]">Total</span>
                <span className="tf-gradient-text text-3xl font-bold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              {user ? (
                <button
                  onClick={handleCheckout}
                  disabled={processingOrder || cartLoading}
                  className="tf-btn tf-btn-primary w-full text-base"
                >
                  {processingOrder ? 'Procesando Pedido...' : 'Confirmar Pedido'}
                </button>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-sm text-[#8fa0c4]">
                    Inicia sesión para continuar con tu pedido
                  </p>
                  <Link href="/login" className="tf-btn tf-btn-primary w-full">
                    Iniciar Sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TfLayout>
  );
}
