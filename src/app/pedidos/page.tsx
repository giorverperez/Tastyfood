'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Receipt } from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useAuth } from '@/context/AuthContext';
import { facturasService, type FacturaCompleta } from '@/lib/database';
import QRCode from 'qrcode';

/**
 * Estados reales de la tabla `facturas`. La restricción CHECK de la base solo
 * admite estos tres. Antes aquí se usaban 'confirmada' | 'entregada' |
 * 'cancelada', que no existen: al marcar el admin una factura como pagada, el
 * cliente veía el texto crudo "pagado" sin color ni traducción.
 */
type EstadoFactura = 'pendiente' | 'pagado' | 'cancelado';

const ESTADOS: Record<EstadoFactura, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
  },
  // El panel muestra 'pagado' como "entregado"; se mantiene ese lenguaje.
  pagado: {
    label: 'Entregado',
    className: 'bg-lime-400/15 text-lime-200 border-lime-400/30',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
  },
};

const estadoInfo = (estado: string) =>
  ESTADOS[estado as EstadoFactura] ?? {
    label: estado,
    className: 'bg-white/5 text-[#8fa0c4] border-white/10',
  };

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [facturas, setFacturas] = useState<FacturaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedFactura, setSelectedFactura] = useState<FacturaCompleta | null>(null);

  const cargarFacturas = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setFacturas(await facturasService.obtenerPorUsuario(user.id));
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setError('Error al cargar el historial de pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    cargarFacturas();
  }, [user, router, cargarFacturas]);

  const generarQR = async (factura: FacturaCompleta) => {
    try {
      const qrData = JSON.stringify({
        numero_factura: factura.numero_factura,
        total: factura.total,
        fecha: factura.fecha_factura,
        cliente_id: user?.id,
      });

      const qrUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        color: { dark: '#04060f', light: '#ffffff' },
      });

      setQrCodeUrl(qrUrl);
      setSelectedFactura(factura);
      setShowQR(true);
    } catch (error) {
      console.error('Error al generar QR:', error);
    }
  };

  if (!user) return null;

  return (
    <TfLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">
          Mis <span className="tf-gradient-text">Pedidos</span>
        </h1>

        {/* Modal QR */}
        {showQR && selectedFactura && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="tf-glass tf-glass-edge tf-glow-cyan w-full max-w-md p-8 text-center">
              <h2 className="mb-2.5 text-2xl font-bold">Código QR del Pedido</h2>
              <p className="mb-7 text-sm text-[#8fa0c4]">
                Presenta este código al momento de recoger tu pedido.
              </p>

              <div className="mx-auto mb-7 w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="Código QR del pedido" className="h-48 w-48" />
              </div>

              <div className="mb-7 space-y-2 text-sm text-[#8fa0c4]">
                <p>
                  Pedido:{' '}
                  <span className="font-semibold text-[#e8eefc]">
                    #{selectedFactura.numero_factura}
                  </span>
                </p>
                <p>
                  Total:{' '}
                  <span className="font-semibold text-[#e8eefc]">
                    ${selectedFactura.total.toFixed(2)}
                  </span>
                </p>
                <p>
                  Estado:{' '}
                  <span className="font-semibold text-[#e8eefc]">
                    {estadoInfo(selectedFactura.estado).label}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="tf-btn tf-btn-primary w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="tf-glass h-64 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : facturas.length === 0 ? (
          <div className="tf-glass p-14 text-center">
            <Receipt className="mx-auto mb-5 text-[#5b6b8f]" size={44} />
            <p className="mb-7 text-lg text-[#8fa0c4]">No tienes pedidos aún</p>
            <Link href="/productos" className="tf-btn tf-btn-primary">
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {facturas.map((factura) => {
              const estado = estadoInfo(factura.estado);

              return (
                <div key={factura.id} className="tf-glass tf-glass-edge p-6 md:p-7">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#e8eefc]">
                        Pedido #{factura.numero_factura}
                      </h3>
                      <p className="mt-1 text-sm text-[#8fa0c4]">
                        {new Date(factura.fecha_factura).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-[#8fa0c4]">Pago: Efectivo</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${estado.className}`}
                      >
                        {estado.label}
                      </span>
                      <p className="mt-2.5 text-2xl font-bold text-[#e8eefc]">
                        ${factura.total.toFixed(2)}
                      </p>
                      {factura.estado === 'pendiente' && (
                        <button
                          onClick={() => generarQR(factura)}
                          className="tf-btn tf-btn-ghost mt-3 !px-3.5 !py-1.5 text-xs"
                        >
                          <QrCode size={14} />
                          Ver QR
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-cyan-400/12 pt-5">
                    <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Productos
                    </h4>
                    <div className="mb-5 space-y-2.5">
                      {factura.productos?.map((producto, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[#e8eefc]">
                            {producto.producto_nombre}
                            <span className="ml-2 text-[#5b6b8f]">
                              × {producto.cantidad}
                            </span>
                          </span>
                          <span className="text-[#e8eefc]">
                            ${producto.precio_total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 border-t border-cyan-400/12 pt-4 text-sm">
                      <div className="flex justify-between text-[#8fa0c4]">
                        <span>Subtotal</span>
                        <span>${factura.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#8fa0c4]">
                        <span>IVA (15%)</span>
                        <span>${factura.impuesto.toFixed(2)}</span>
                      </div>
                      {factura.descuento > 0 && (
                        <div className="flex justify-between text-rose-300">
                          <span>Descuento</span>
                          <span>-${factura.descuento.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-cyan-400/12 pt-2.5 text-base font-bold text-[#e8eefc]">
                        <span>Total</span>
                        <span>${factura.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {factura.estado === 'pendiente' && (
                    <p className="mt-5 border-t border-cyan-400/12 pt-5 text-sm text-[#8fa0c4]">
                      Tu pedido está reservado. Presenta el código QR para pagarlo al
                      recogerlo.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TfLayout>
  );
}
