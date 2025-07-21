'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { facturasService, type FacturaCompleta } from '@/lib/database';
import QRCode from 'qrcode';

type EstadoFactura = 'pendiente' | 'confirmada' | 'entregada' | 'cancelada';

interface FacturaConDetalles extends FacturaCompleta {
  estado_display: string;
  metodo_pago_display: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [facturas, setFacturas] = useState<FacturaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedFactura, setSelectedFactura] = useState<FacturaConDetalles | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    cargarFacturas();
  }, [user, router]);

  const cargarFacturas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const facturasData = await facturasService.obtenerPorUsuario(user.id);
      
      const facturasConDetalles: FacturaConDetalles[] = facturasData.map(factura => ({
        ...factura,
        estado_display: getEstadoDisplay(factura.estado as EstadoFactura),
        metodo_pago_display: getMetodoPagoDisplay()
      }));
      
      setFacturas(facturasConDetalles);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setError('Error al cargar el historial de pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoDisplay = (estado: EstadoFactura): string => {
    const estados = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'entregada': 'Entregada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
  };

  const getMetodoPagoDisplay = (): string => {
    return 'Efectivo';
  };

  const getEstadoColor = (estado: EstadoFactura): string => {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'confirmada': 'bg-blue-100 text-blue-800',
      'entregada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const generarQR = async (factura: FacturaConDetalles) => {
    try {
      const qrData = JSON.stringify({
        numero_factura: factura.numero_factura,
        total: factura.total,
        fecha: factura.fecha_factura,
        cliente_id: user?.id
      });
      
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qrUrl);
      setSelectedFactura(factura);
      setShowQR(true);
    } catch (error) {
      console.error('Error al generar QR:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        
        {/* Modal QR Code */}
        {showQR && selectedFactura && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-600">Código QR del Pedido</h2>
                <p className="text-gray-600 mb-6">
                  Presenta este código QR al momento de recoger tu pedido.
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
                    <strong>Pedido:</strong> #{selectedFactura.numero_factura}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> ${selectedFactura.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Estado:</strong> {selectedFactura.estado_display}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowQR(false)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg mb-4">No tienes pedidos aún</p>
            <button 
              onClick={() => router.push('/productos')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {facturas.map(factura => (
              <div key={factura.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Pedido #{factura.numero_factura}</h3>
                    <p className="text-gray-600">Fecha: {new Date(factura.fecha_factura).toLocaleDateString('es-ES')}</p>
                    <p className="text-gray-600">Método de pago: {factura.metodo_pago_display}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      getEstadoColor(factura.estado as EstadoFactura)
                    }`}>
                      {factura.estado_display}
                    </span>
                    <p className="text-xl font-bold text-blue-600 mt-2">${factura.total.toFixed(2)}</p>
                    {factura.estado === 'pendiente' && (
                      <button
                        onClick={() => generarQR(factura)}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Ver QR
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Productos:</h4>
                  <div className="space-y-2 mb-4">
                    {factura.productos?.map((producto, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{producto.producto_nombre}</span>
                          <span className="text-gray-600 ml-2">x{producto.cantidad}</span>
                        </div>
                        <span className="font-medium">${producto.precio_total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desglose de factura */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>${factura.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (15%):</span>
                      <span>${factura.impuesto.toFixed(2)}</span>
                    </div>
                    {factura.descuento > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento:</span>
                        <span className="text-red-600">-${factura.descuento.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">${factura.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {factura.estado === 'pendiente' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Tu pedido ha sido reservado. Presenta este qr para pagar.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}