'use client';

import { useState, useEffect } from 'react';
import { 
  productosService, 
  seccionesService, 
  sincronizacionService,
  type Producto, 
  type Seccion 
} from '@/lib/database';

interface ProductoConStock extends Producto {
  stock_disponible: number;
}

export function useProducts() {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar secciones
        const seccionesData = await seccionesService.obtenerTodas();
        setSecciones(seccionesData);
        
        // Cargar productos con stock
        const productosConStock = await productosService.obtenerConStock();
        setProductos(productosConStock);
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const canal = sincronizacionService.suscribirseACambios({
      onProductoActualizado: (producto) => {
        setProductos(prev => 
          prev.map(p => p.id === producto.id ? { ...p, ...producto } : p)
        );
      },
      onStockActualizado: (productoId, nuevoStock) => {
        setProductos(prev => 
          prev.map(p => 
            p.id === productoId 
              ? { ...p, stock_disponible: nuevoStock }
              : p
          )
        );
      }
    });

    return () => {
      canal?.unsubscribe();
    };
  }, []);

  // Funciones auxiliares
  const obtenerProductoPorId = (id: number): ProductoConStock | undefined => {
    return productos.find(p => p.id === id);
  };

  const obtenerProductosPorSeccion = (seccionId: number): ProductoConStock[] => {
    return productos.filter(p => p.seccion_id === seccionId);
  };

  const refrescarStock = async () => {
    try {
      const productosActualizados = await productosService.obtenerConStock();
      setProductos(productosActualizados);
    } catch (err) {
      console.error('Error al refrescar stock:', err);
    }
  };

  return {
    productos,
    secciones,
    loading,
    error,
    obtenerProductoPorId,
    obtenerProductosPorSeccion,
    refrescarStock
  };
}

export function useProduct(id: number) {
  const [producto, setProducto] = useState<ProductoConStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setLoading(true);
        setError(null);

        const productoData = await productosService.obtenerPorIdConStock(id);
        if (!productoData) {
          setError('Producto no encontrado');
          return;
        }

        setProducto(productoData);
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    cargarProducto();
  }, [id]);

  return {
    producto,
    loading,
    error
  };
}