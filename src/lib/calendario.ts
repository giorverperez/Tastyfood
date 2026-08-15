import { supabase } from './supabase';

/**
 * Datos del calendario del cliente.
 *
 * Todo lo de aquí es SOLO LECTURA. El cliente consulta; no crea ni edita
 * nada desde esta pantalla.
 */

export interface MenuDelDia {
  producto_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  seccion: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  cantidad_vendida: number;
}

export interface PedidoDelDia {
  id: number;
  numero_factura: string;
  total: number;
  estado: string;
  fecha_factura: string;
  productos: { nombre: string; cantidad: number; precio_total: number }[];
}

export interface AvisoDelDia {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  all_day: boolean;
  priority: string;
}

export interface MovimientoDelDia {
  platos_vendidos: number;
  mas_vendidos: { nombre: string; cantidad: number }[];
}

/** Convierte una fecha a 'YYYY-MM-DD' en horario local, sin desfase de zona. */
export function aFechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const calendarioService = {
  /** Menú que hubo (o hay) ese día, con lo que quedó disponible. */
  async menuDelDia(fecha: string): Promise<MenuDelDia[]> {
    const { data, error } = await supabase
      .from('stock_diario')
      .select(
        `
        cantidad_inicial,
        cantidad_actual,
        cantidad_vendida,
        productos!inner (
          id, nombre, descripcion, precio, imagen_url, activo,
          secciones ( nombre )
        )
      `
      )
      .eq('fecha', fecha)
      .eq('productos.activo', true);

    if (error) throw error;

    type Fila = {
      cantidad_inicial: number;
      cantidad_actual: number;
      cantidad_vendida: number;
      productos: {
        id: number;
        nombre: string;
        descripcion?: string;
        precio: number;
        imagen_url?: string;
        secciones?: { nombre: string } | { nombre: string }[] | null;
      };
    };

    return ((data || []) as unknown as Fila[]).map((fila) => {
      const seccionRel = fila.productos.secciones;
      const seccion = Array.isArray(seccionRel) ? seccionRel[0] : seccionRel;

      return {
        producto_id: fila.productos.id,
        nombre: fila.productos.nombre,
        descripcion: fila.productos.descripcion,
        precio: Number(fila.productos.precio),
        imagen_url: fila.productos.imagen_url,
        seccion: seccion?.nombre ?? 'Otros',
        cantidad_inicial: fila.cantidad_inicial,
        cantidad_actual: fila.cantidad_actual,
        cantidad_vendida: fila.cantidad_vendida,
      };
    });
  },

  /**
   * Pedidos del propio cliente ese día.
   * La política RLS de `facturas` ya impide leer los de otras personas,
   * pero se filtra igualmente por cliente_id para no depender solo de eso.
   */
  async misPedidosDelDia(clienteId: string, fecha: string): Promise<PedidoDelDia[]> {
    const { data, error } = await supabase
      .from('facturas')
      .select(
        `
        id, numero_factura, total, estado, fecha_factura,
        factura_detalles ( cantidad, precio_total, productos ( nombre ) )
      `
      )
      .eq('cliente_id', clienteId)
      .gte('fecha_factura', `${fecha}T00:00:00`)
      .lte('fecha_factura', `${fecha}T23:59:59`)
      .order('fecha_factura', { ascending: false });

    if (error) throw error;

    type Detalle = {
      cantidad: number;
      precio_total: number;
      productos: { nombre: string } | { nombre: string }[] | null;
    };

    return (data || []).map((f) => ({
      id: f.id,
      numero_factura: f.numero_factura,
      total: Number(f.total),
      estado: f.estado,
      fecha_factura: f.fecha_factura,
      productos: ((f.factura_detalles || []) as unknown as Detalle[]).map((d) => {
        const rel = d.productos;
        const prod = Array.isArray(rel) ? rel[0] : rel;
        return {
          nombre: prod?.nombre ?? '',
          cantidad: d.cantidad,
          precio_total: Number(d.precio_total),
        };
      }),
    }));
  },

  /** Fechas del mes en las que el cliente tiene pedidos, para marcarlas. */
  async diasConPedidos(clienteId: string, desde: string, hasta: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('facturas')
      .select('fecha_factura')
      .eq('cliente_id', clienteId)
      .gte('fecha_factura', `${desde}T00:00:00`)
      .lte('fecha_factura', `${hasta}T23:59:59`);

    if (error) throw error;

    return new Set((data || []).map((f) => String(f.fecha_factura).slice(0, 10)));
  },

  /**
   * Avisos publicados por el restaurante que abarcan ese rango.
   * La política RLS solo devuelve los marcados como `publico`.
   */
  async avisos(desde: string, hasta: string): Promise<AvisoDelDia[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date, start_time, end_time, all_day, priority')
      .lte('start_date', hasta)
      .gte('end_date', desde)
      .order('start_date');

    if (error) {
      // Si aún no se ejecutó calendario_cliente.sql la columna `publico` no
      // existe y la consulta falla: se degrada a "sin avisos" en vez de
      // tumbar toda la pantalla.
      console.warn('No se pudieron cargar los avisos:', error.message);
      return [];
    }

    return (data || []) as AvisoDelDia[];
  },

  /**
   * Movimiento del día: cuántos platos salieron y cuáles más.
   *
   * Se calcula desde `ventas`, que solo guarda producto, cantidad y fecha.
   * No expone quién compró: eso son datos de otros clientes.
   */
  async movimientoDelDia(fecha: string): Promise<MovimientoDelDia> {
    const { data, error } = await supabase
      .from('ventas')
      .select('cantidad, productos ( nombre )')
      .gte('fecha_venta', `${fecha}T00:00:00`)
      .lte('fecha_venta', `${fecha}T23:59:59`);

    if (error) throw error;

    type Venta = {
      cantidad: number;
      productos: { nombre: string } | { nombre: string }[] | null;
    };

    const porProducto = new Map<string, number>();
    let total = 0;

    for (const v of (data || []) as unknown as Venta[]) {
      const rel = v.productos;
      const prod = Array.isArray(rel) ? rel[0] : rel;
      const nombre = prod?.nombre ?? 'Producto';
      porProducto.set(nombre, (porProducto.get(nombre) ?? 0) + v.cantidad);
      total += v.cantidad;
    }

    const mas_vendidos = [...porProducto.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return { platos_vendidos: total, mas_vendidos };
  },
};
