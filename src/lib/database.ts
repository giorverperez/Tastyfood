import { supabase } from './supabase';

// Tipos basados en la estructura de la base de datos
export interface Seccion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  seccion_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
  seccion?: Seccion;
}

export interface StockDiario {
  id: number;
  producto_id: number;
  fecha: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  cantidad_vendida: number;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: number;
  numero_factura: string;
  cliente_id: string;
  empleado_id?: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'cancelado';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia';
  notas?: string;
  fecha_factura: string;
  created_at: string;
  updated_at: string;
}

export interface FacturaDetalle {
  id: number;
  factura_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  created_at: string;
}

export interface ProductoCarrito {
  id: number;
  name: string;
  price: number;
  quantity: number;
  producto_id?: number; // Para compatibilidad con BD
  cantidad?: number;    // Para compatibilidad con BD
}

// Tipo para productos en facturas completas (desde la vista)
export interface ProductoFactura {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
}

// Tipo para facturas completas (vista de la BD)
export interface FacturaCompleta {
  id: number;
  numero_factura: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  estado: 'pendiente' | 'confirmada' | 'entregada' | 'cancelada';
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  notas?: string;
  fecha_factura: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  empleado_nombre?: string;
  empleado_apellido?: string;
  productos: ProductoFactura[];
}

// Servicios para Secciones (Categorías)
export const seccionesService = {
  async obtenerTodas(): Promise<Seccion[]> {
    const { data, error } = await supabase
      .from('secciones')
      .select('*')
      .eq('activo', true)
      .order('orden');
    
    if (error) throw error;
    return data || [];
  },

  async crear(seccion: Omit<Seccion, 'id' | 'created_at' | 'updated_at'>): Promise<Seccion> {
    const { data, error } = await supabase
      .from('secciones')
      .insert(seccion)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Servicios para Productos
export const productosService = {
  async obtenerTodos(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        seccion:secciones(*)
      `)
      .eq('activo', true)
      .order('orden');
    
    if (error) throw error;
    return data || [];
  },

  async obtenerPorSeccion(seccionId: number): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        seccion:secciones(*)
      `)
      .eq('seccion_id', seccionId)
      .eq('activo', true)
      .order('orden');
    
    if (error) throw error;
    return data || [];
  },

  async obtenerPorId(id: number): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        seccion:secciones(*)
      `)
      .eq('id', id)
      .eq('activo', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data;
  },

  async obtenerConStock(): Promise<(Producto & { stock_disponible: number })[]> {
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        seccion:secciones(*),
        stock_diario!inner (
          cantidad_actual
        )
      `)
      .eq('activo', true)
      .eq('stock_diario.fecha', fechaHoy)
      .order('orden');

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      stock_disponible: item.stock_diario?.[0]?.cantidad_actual || 0
    }));
  },

  async obtenerPorIdConStock(id: number): Promise<(Producto & { stock_disponible: number }) | null> {
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        seccion:secciones(*),
        stock_diario (
          cantidad_actual
        )
      `)
      .eq('id', id)
      .eq('activo', true)
      .eq('stock_diario.fecha', fechaHoy)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      stock_disponible: data.stock_diario?.[0]?.cantidad_actual || 0
    };
  },

  async crear(producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .insert(producto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async actualizar(id: number, producto: Partial<Producto>): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .update({ ...producto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async eliminar(id: number): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }
};

// Servicios para Stock Diario
export const stockService = {
  async obtenerStockActual(productoId: number): Promise<number> {
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('stock_diario')
      .select('cantidad_actual')
      .eq('producto_id', productoId)
      .eq('fecha', fechaHoy)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.cantidad_actual || 0;
  },

  async verificarDisponibilidad(productos: ProductoCarrito[]): Promise<{ disponible: boolean; mensaje?: string }> {
    for (const item of productos) {
      const productoId = item.producto_id || item.id;
      const cantidad = item.cantidad || item.quantity;
      const stockActual = await this.obtenerStockActual(productoId);
      if (stockActual < cantidad) {
        const producto = await productosService.obtenerPorId(productoId);
        return {
          disponible: false,
          mensaje: `Stock insuficiente para ${producto?.nombre}. Disponible: ${stockActual}, Solicitado: ${cantidad}`
        };
      }
    }
    return { disponible: true };
  },

  async inicializarStockDiario(productoId: number, cantidad: number): Promise<void> {
    const { error } = await supabase.rpc('inicializar_stock_diario', {
      p_producto_id: productoId,
      p_cantidad: cantidad
    });

    if (error) throw error;
  },

  async obtenerStockDiario(fecha?: string): Promise<StockDiario[]> {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('stock_diario')
      .select(`
        *,
        productos (
          id,
          nombre,
          precio
        )
      `)
      .eq('fecha', fechaConsulta)
      .order('producto_id');

    if (error) throw error;
    return data || [];
  }
};

// Tipo para respuesta de creación de factura
export interface RespuestaCrearFactura {
  success: boolean;
  factura_id?: number;
  numero_factura?: string;
  subtotal?: number;
  impuesto?: number;
  total?: number;
  message?: string;
}

// Servicios para Facturas
export const facturasService = {
  async crear(datosFactura: {
    cliente_id: string;
    productos: ProductoCarrito[];
    metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
    notas?: string;
  }): Promise<RespuestaCrearFactura> {
    const { cliente_id, productos, metodo_pago, notas } = datosFactura;

    // Preparar productos en formato JSON para la función de BD
     const productosJson = productos.map(p => ({
       producto_id: p.id,
       cantidad: p.quantity
     }));

    // Usar la función crear_factura de la base de datos
    const { data, error } = await supabase.rpc('crear_factura', {
      p_cliente_id: cliente_id,
      p_empleado_id: null, // En este caso no hay empleado específico
      p_productos: JSON.stringify(productosJson),
      p_metodo_pago: metodo_pago,
      p_notas: notas || null
    });

    if (error) throw error;
    
    // Verificar si la función retornó un error
    if (data && !data.success) {
      throw new Error(data.message);
    }

    return data;
  },

  async obtenerPorUsuario(clienteId: string): Promise<FacturaCompleta[]> {
    const { data, error } = await supabase
      .from('facturas_completas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async obtenerPorCliente(clienteId: string): Promise<FacturaCompleta[]> {
    return this.obtenerPorUsuario(clienteId);
  },

  async obtenerPorId(facturaId: number): Promise<FacturaCompleta | null> {
    const { data, error } = await supabase
      .from('facturas_completas')
      .select('*')
      .eq('id', facturaId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }
};

// Servicio para subir imágenes al bucket
export const imagenesService = {
  async subirImagen(archivo: File, ruta: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  },

  async obtenerPorProducto(productoId: number): Promise<{ id: string; url: string; nombre?: string }[]> {
    // Simular obtención de imágenes por producto
    // En una implementación real, esto podría consultar una tabla de imágenes
    const { data, error } = await supabase.storage
      .from('productos')
      .list(`producto_${productoId}`, {
        limit: 10,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) throw error;
    
    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(`producto_${productoId}/${file.name}`);
      
      return {
        id: file.id || file.name,
        url: urlData.publicUrl,
        nombre: file.name
      };
    });
  },

  async obtenerUrlPublica(ruta: string): Promise<string> {
    const { data } = supabase.storage
      .from('productos')
      .getPublicUrl(ruta);
    
    return data.publicUrl;
  },

  async eliminarImagen(ruta: string): Promise<void> {
    const { error } = await supabase.storage
      .from('productos')
      .remove([ruta]);
    
    if (error) throw error;
  }
};

// Tipos para payloads de sincronización
export interface PayloadCambio {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  schema: string;
  table: string;
}

// Sistema de sincronización en tiempo real
export const sincronizacionService = {
  // Suscribirse a cambios en stock
  suscribirseAStock(callback: (payload: PayloadCambio) => void) {
    return supabase
      .channel('stock_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_diario'
        },
        callback
      )
      .subscribe();
  },

  // Suscribirse a cambios en productos
  suscribirseAProductos(callback: (payload: PayloadCambio) => void) {
    return supabase
      .channel('product_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos'
        },
        callback
      )
      .subscribe();
  },

  // Suscribirse a cambios en facturas
  suscribirseAFacturas(callback: (payload: PayloadCambio) => void) {
    return supabase
      .channel('invoice_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'facturas'
        },
        callback
      )
      .subscribe();
  },

  // Función unificada para suscribirse a cambios
  suscribirseACambios(callbacks: {
    onProductoActualizado?: (producto: Producto) => void;
    onStockActualizado?: (productoId: number, nuevoStock: number) => void;
    onFacturaCreada?: (factura: Factura) => void;
  }) {
    const channel = supabase.channel('unified_changes');

    // Suscribirse a cambios de productos
    if (callbacks.onProductoActualizado) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'productos'
        },
        (payload) => {
          if (callbacks.onProductoActualizado) {
            callbacks.onProductoActualizado(payload.new as Producto);
          }
        }
      );
    }

    // Suscribirse a cambios de stock
    if (callbacks.onStockActualizado) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_diario'
        },
        (payload) => {
          if (callbacks.onStockActualizado && payload.new && 
              typeof payload.new === 'object' && 
              'producto_id' in payload.new && 
              'cantidad_actual' in payload.new) {
            const stockData = payload.new as StockDiario;
            callbacks.onStockActualizado(
              stockData.producto_id,
              stockData.cantidad_actual
            );
          }
        }
      );
    }

    // Suscribirse a cambios de facturas
    if (callbacks.onFacturaCreada) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'facturas'
        },
        (payload) => {
          if (callbacks.onFacturaCreada && payload.new) {
            callbacks.onFacturaCreada(payload.new as Factura);
          }
        }
      );
    }

    return channel.subscribe();
  }
};