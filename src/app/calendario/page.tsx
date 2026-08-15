'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Megaphone,
  Receipt,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useAuth } from '@/context/AuthContext';
import {
  aFechaISO,
  calendarioService,
  type AvisoDelDia,
  type MenuDelDia,
  type MovimientoDelDia,
  type PedidoDelDia,
} from '@/lib/calendario';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ESTADOS: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-400/15 text-amber-200 border-amber-400/30' },
  pagado:    { label: 'Entregado', className: 'bg-lime-400/15 text-lime-200 border-lime-400/30' },
  cancelado: { label: 'Cancelado', className: 'bg-rose-500/15 text-rose-200 border-rose-500/30' },
};

export default function CalendarioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaElegido, setDiaElegido] = useState<string>(() => aFechaISO(hoy));

  const [diasConPedidos, setDiasConPedidos] = useState<Set<string>>(new Set());
  const [avisosMes, setAvisosMes] = useState<AvisoDelDia[]>([]);

  const [menu, setMenu] = useState<MenuDelDia[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDelDia[]>([]);
  const [movimiento, setMovimiento] = useState<MovimientoDelDia | null>(null);
  const [cargandoDia, setCargandoDia] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // ---- Rejilla del mes, empezando en lunes ----
  const celdas = useMemo(() => {
    const primero = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
    const ultimo = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0);

    // getDay(): 0 = domingo. Se desplaza para que la semana arranque en lunes.
    const hueco = (primero.getDay() + 6) % 7;

    const lista: (Date | null)[] = Array(hueco).fill(null);
    for (let d = 1; d <= ultimo.getDate(); d++) {
      lista.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d));
    }
    return lista;
  }, [mesVisible]);

  // ---- Datos del mes: marcar días con pedidos y avisos ----
  useEffect(() => {
    if (!user) return;

    const desde = aFechaISO(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1));
    const hasta = aFechaISO(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0));

    let cancelado = false;

    (async () => {
      try {
        const [dias, avisos] = await Promise.all([
          calendarioService.diasConPedidos(user.id, desde, hasta),
          calendarioService.avisos(desde, hasta),
        ]);
        if (cancelado) return;
        setDiasConPedidos(dias);
        setAvisosMes(avisos);
      } catch (error) {
        console.error('Error al cargar el mes:', error);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [user, mesVisible]);

  // ---- Datos del día elegido ----
  const cargarDia = useCallback(async () => {
    if (!user) return;

    setCargandoDia(true);
    try {
      const [m, p, mov] = await Promise.all([
        calendarioService.menuDelDia(diaElegido),
        calendarioService.misPedidosDelDia(user.id, diaElegido),
        calendarioService.movimientoDelDia(diaElegido),
      ]);
      setMenu(m);
      setPedidos(p);
      setMovimiento(mov);
    } catch (error) {
      console.error('Error al cargar el día:', error);
    } finally {
      setCargandoDia(false);
    }
  }, [user, diaElegido]);

  useEffect(() => {
    cargarDia();
  }, [cargarDia]);

  if (!user) return null;

  const avisosDelDia = avisosMes.filter(
    (a) => a.start_date <= diaElegido && a.end_date >= diaElegido
  );
  const diasConAviso = new Set(
    avisosMes.flatMap((a) => {
      const dias: string[] = [];
      const cursor = new Date(`${a.start_date}T12:00:00`);
      const fin = new Date(`${a.end_date}T12:00:00`);
      while (cursor <= fin) {
        dias.push(aFechaISO(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return dias;
    })
  );

  const porSeccion = menu.reduce<Record<string, MenuDelDia[]>>((acc, item) => {
    (acc[item.seccion] ||= []).push(item);
    return acc;
  }, {});

  const fechaLarga = new Date(`${diaElegido}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <TfLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Mi <span className="tf-gradient-text">Calendario</span>
        </h1>
        <p className="mt-2.5 flex items-center gap-2 text-[#8fa0c4]">
          <Eye size={15} className="text-cyan-300" />
          Consulta el menú de cada día, tus pedidos y los avisos del local.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ---------- Rejilla del mes ---------- */}
        <div className="tf-glass tf-glass-edge h-fit p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
              aria-label="Mes anterior"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <ChevronLeft size={18} />
            </button>

            <h2 className="font-semibold text-[#e8eefc]">
              {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </h2>

            <button
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
              aria-label="Mes siguiente"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#8fa0c4] transition-colors hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {DIAS.map((d) => (
              <span key={d} className="text-[11px] font-semibold uppercase tracking-wider text-[#5b6b8f]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celdas.map((fecha, i) => {
              if (!fecha) return <span key={`v-${i}`} />;

              const iso = aFechaISO(fecha);
              const esHoy = iso === aFechaISO(hoy);
              const elegido = iso === diaElegido;
              const tienePedido = diasConPedidos.has(iso);
              const tieneAviso = diasConAviso.has(iso);

              return (
                <button
                  key={iso}
                  onClick={() => setDiaElegido(iso)}
                  className={`relative aspect-square rounded-lg text-sm transition-all ${
                    elegido
                      ? 'bg-gradient-to-br from-cyan-400 to-violet-500 font-bold text-[#04060f]'
                      : esHoy
                        ? 'border border-cyan-400/50 text-cyan-200 hover:bg-cyan-400/10'
                        : 'text-[#8fa0c4] hover:bg-cyan-400/10 hover:text-[#e8eefc]'
                  }`}
                >
                  {fecha.getDate()}

                  {/* Marcas: pedido propio (cian) y aviso del local (ámbar) */}
                  {(tienePedido || tieneAviso) && !elegido && (
                    <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                      {tienePedido && <span className="h-1 w-1 rounded-full bg-cyan-400" />}
                      {tieneAviso && <span className="h-1 w-1 rounded-full bg-amber-400" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 border-t border-cyan-400/12 pt-4 text-xs text-[#5b6b8f]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Tus pedidos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Avisos
            </span>
          </div>
        </div>

        {/* ---------- Detalle del día ---------- */}
        <div className="space-y-6 lg:col-span-3">
          <div className="tf-glass flex items-center gap-3 p-5">
            <CalendarDays size={20} className="shrink-0 text-cyan-300" />
            <h2 className="font-semibold capitalize text-[#e8eefc]">{fechaLarga}</h2>
          </div>

          {cargandoDia ? (
            <>
              <div className="tf-glass h-40 animate-pulse" />
              <div className="tf-glass h-32 animate-pulse" />
            </>
          ) : (
            <>
              {/* Avisos */}
              {avisosDelDia.length > 0 && (
                <div className="tf-glass tf-glass-edge p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#e8eefc]">
                    <Megaphone size={17} className="text-amber-300" />
                    Avisos del local
                  </h3>
                  <ul className="space-y-3">
                    {avisosDelDia.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3"
                      >
                        <p className="font-medium text-[#e8eefc]">{a.title}</p>
                        <p className="mt-0.5 text-xs text-[#8fa0c4]">
                          {a.all_day
                            ? 'Todo el día'
                            : [a.start_time, a.end_time].filter(Boolean).join(' - ') || 'Sin horario'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Menú del día */}
              <div className="tf-glass tf-glass-edge p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#e8eefc]">
                  <UtensilsCrossed size={17} className="text-cyan-300" />
                  Menú de este día
                </h3>

                {menu.length === 0 ? (
                  <p className="text-sm text-[#8fa0c4]">
                    No hubo carta publicada para esta fecha.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(porSeccion).map(([seccion, items]) => (
                      <div key={seccion}>
                        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                          {seccion}
                        </h4>
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li
                              key={item.producto_id}
                              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-cyan-400/5"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-[#e8eefc]">
                                {item.nombre}
                              </span>
                              <span className="text-sm text-[#8fa0c4]">
                                ${item.precio.toFixed(2)}
                              </span>
                              <span
                                className={`w-24 shrink-0 text-right text-xs ${
                                  item.cantidad_actual > 0 ? 'text-lime-300' : 'text-rose-300'
                                }`}
                              >
                                {item.cantidad_actual > 0
                                  ? `${item.cantidad_actual} disponibles`
                                  : 'Agotado'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {diaElegido === aFechaISO(hoy) && menu.length > 0 && (
                  <Link href="/productos" className="tf-btn tf-btn-primary mt-6 w-full">
                    Hacer un pedido
                  </Link>
                )}
              </div>

              {/* Mis pedidos */}
              <div className="tf-glass tf-glass-edge p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#e8eefc]">
                  <Receipt size={17} className="text-cyan-300" />
                  Mis pedidos de este día
                </h3>

                {pedidos.length === 0 ? (
                  <p className="text-sm text-[#8fa0c4]">No hiciste pedidos esta fecha.</p>
                ) : (
                  <ul className="space-y-3">
                    {pedidos.map((p) => {
                      const estado = ESTADOS[p.estado] ?? {
                        label: p.estado,
                        className: 'bg-white/5 text-[#8fa0c4] border-white/10',
                      };

                      return (
                        <li key={p.id} className="rounded-xl border border-cyan-400/15 p-4">
                          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-[#e8eefc]">
                              #{p.numero_factura}
                            </span>
                            <span className="flex items-center gap-2.5">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${estado.className}`}
                              >
                                {estado.label}
                              </span>
                              <span className="font-bold text-[#e8eefc]">
                                ${p.total.toFixed(2)}
                              </span>
                            </span>
                          </div>
                          <ul className="space-y-1 text-sm text-[#8fa0c4]">
                            {p.productos.map((prod, i) => (
                              <li key={i} className="flex justify-between">
                                <span>
                                  {prod.nombre}
                                  <span className="ml-1.5 text-[#5b6b8f]">× {prod.cantidad}</span>
                                </span>
                                <span>${prod.precio_total.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Movimiento del día (anonimizado) */}
              <div className="tf-glass p-6">
                <h3 className="mb-1.5 flex items-center gap-2 font-semibold text-[#e8eefc]">
                  <TrendingUp size={17} className="text-cyan-300" />
                  Movimiento del día
                </h3>
                <p className="mb-4 text-xs text-[#5b6b8f]">
                  Cifras generales del local. No se muestran datos de otros clientes.
                </p>

                {!movimiento || movimiento.platos_vendidos === 0 ? (
                  <p className="text-sm text-[#8fa0c4]">Aún no hay ventas registradas.</p>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-[#8fa0c4]">
                      <span className="text-2xl font-bold text-[#e8eefc]">
                        {movimiento.platos_vendidos}
                      </span>{' '}
                      platos servidos
                    </p>
                    <ul className="space-y-2">
                      {movimiento.mas_vendidos.map((p, i) => (
                        <li key={p.nombre} className="flex items-center gap-3 text-sm">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-cyan-400/10 text-xs font-bold text-cyan-300">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[#e8eefc]">{p.nombre}</span>
                          <span className="flex items-center gap-1 text-[#8fa0c4]">
                            <BadgeCheck size={13} className="text-lime-300" />
                            {p.cantidad}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </TfLayout>
  );
}
