'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { stockService, sincronizacionService, ProductoCarrito, StockDiario } from '@/lib/database';

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stockDisponible?: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  verificarDisponibilidad: () => Promise<{ disponible: boolean; mensaje?: string }>;
  loading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Configurar suscripción a cambios de stock en tiempo real
  useEffect(() => {
    const channel = sincronizacionService.suscribirseAStock((payload) => {
      // Actualizar stock disponible cuando cambie
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        if (payload.new && typeof payload.new === 'object' && 
            'producto_id' in payload.new && 'cantidad_actual' in payload.new) {
          const stockData = payload.new as StockDiario;
          setItems(currentItems =>
            currentItems.map(item =>
              item.id === stockData.producto_id
                ? { ...item, stockDisponible: stockData.cantidad_actual }
                : item
            )
          );
        }
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const verificarDisponibilidad = async (): Promise<{ disponible: boolean; mensaje?: string }> => {
    const productos: ProductoCarrito[] = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const resultado = await stockService.verificarDisponibilidad(productos);
    
    if (!resultado.disponible && resultado.mensaje) {
      return {
        disponible: false,
        mensaje: resultado.mensaje + ' para hoy'
      };
    }
    
    return resultado;
  };

  const addItem = async (item: CartItem): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      // Verificar stock diario disponible antes de agregar
      const stockActual = await stockService.obtenerStockActual(item.id);
      
      const existingItem = items.find(i => i.id === item.id);
      const cantidadTotal = existingItem ? existingItem.quantity + item.quantity : item.quantity;
      
      if (stockActual < cantidadTotal) {
        return {
          success: false,
          message: `Stock insuficiente para hoy. Disponible: ${stockActual}, Solicitado: ${cantidadTotal}`
        };
      }

      setItems(currentItems => {
        if (existingItem) {
          return currentItems.map(i =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity, stockDisponible: stockActual }
              : i
          );
        }
        return [...currentItems, { ...item, stockDisponible: stockActual }];
      });

      return { success: true };
    } catch (error) {
      console.error('Error al agregar item al carrito:', error);
      return {
        success: false,
        message: 'Error al verificar disponibilidad del producto para hoy'
      };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (itemId: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = async (itemId: number, quantity: number): Promise<{ success: boolean; message?: string }> => {
    if (quantity <= 0) {
      removeItem(itemId);
      return { success: true };
    }

    setLoading(true);
    try {
      // Verificar stock diario disponible
      const stockActual = await stockService.obtenerStockActual(itemId);
      
      if (stockActual < quantity) {
        return {
          success: false,
          message: `Stock insuficiente para hoy. Disponible: ${stockActual}, Solicitado: ${quantity}`
        };
      }

      setItems(currentItems =>
        currentItems.map(item =>
          item.id === itemId 
            ? { ...item, quantity, stockDisponible: stockActual } 
            : item
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      return {
        success: false,
        message: 'Error al verificar disponibilidad del producto para hoy'
      };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        verificarDisponibilidad,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}