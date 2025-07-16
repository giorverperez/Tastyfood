'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { facturasService, type FacturaCompleta } from '@/lib/database';

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
        metodo_pago_display: getMetodoPagoDisplay(factura.metodo_pago)
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

  const getMetodoPagoDisplay = (metodo: string): string => {
    const metodos = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia'
    };
    return metodos[metodo as keyof typeof metodos] || metodo;
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

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        
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
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Productos:</h4>
                  <div className="space-y-2">
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
                </div>
                
                {factura.estado === 'pendiente' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Tu pedido está siendo procesado. Te notificaremos cuando esté listo.
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