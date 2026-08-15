import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChefHat, Clock, Leaf, Sparkles, Target, Users } from 'lucide-react';
import TfNavbar from '@/components/TfNavbar';
import TfFooter from '@/components/TfFooter';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Nosotros | TastyFood',
  description:
    'La historia de TastyFood: cocina manabita servida con tecnología, en ULEAM, Manta.',
};

const VALORES = [
  {
    Icon: Leaf,
    title: 'Ingredientes frescos',
    text: 'Compramos a diario. Lo que no es fresco, no sale de nuestra cocina.',
  },
  {
    Icon: Clock,
    title: 'Stock en tiempo real',
    text: 'Nuestro sistema descuenta cada plato al instante: si aparece disponible, lo está.',
  },
  {
    Icon: ChefHat,
    title: 'Recetas de casa',
    text: 'Sabores manabitas de siempre, preparados con técnica y sin atajos.',
  },
  {
    Icon: Users,
    title: 'Cerca de la comunidad',
    text: `Servimos cada día a estudiantes y personal de ${SITE.address}.`,
  },
];

const HITOS = [
  { year: SITE.since, title: 'Los inicios', text: 'Abrimos con un menú corto y una idea fija: comida honesta y rápida.' },
  { year: 2018, title: 'Cocina propia', text: 'Ampliamos a desayunos, almuerzos y meriendas con producción diaria.' },
  { year: 2024, title: 'Pedidos digitales', text: 'Lanzamos el pedido en línea con comprobante y código QR.' },
  { year: 2025, title: 'Sistema conectado', text: 'Stock, ventas y comprobantes sincronizados al instante.' },
];

export default function NosotrosPage() {
  return (
    <div className="tf-canvas min-h-screen">
      <TfNavbar />

      <main className="container mx-auto px-4">
        {/* Portada */}
        <section className="py-20 text-center md:py-28">
          <span className="tf-glass inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cyan-300">
            <Sparkles size={13} />
            Nuestra historia
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Cocina manabita,{' '}
            <span className="tf-gradient-text tf-sweep">servida desde el futuro</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#8fa0c4]">
            Desde {SITE.since} preparamos comida de verdad en {SITE.address}. Hoy la
            servimos con un sistema que sabe, minuto a minuto, exactamente qué hay
            disponible.
          </p>
        </section>

        {/* Valores */}
        <section className="pb-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALORES.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="tf-glass tf-glass-edge p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                  <Icon size={20} />
                </span>
                <h3 className="mb-2 font-semibold text-[#e8eefc]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#8fa0c4]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Misión */}
        <section className="pb-20">
          <div className="tf-glass tf-glow-cyan grid grid-cols-1 gap-10 p-8 md:grid-cols-2 md:p-12">
            <div>
              <span className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-[#04060f]">
                <Target size={20} />
              </span>
              <h2 className="mb-4 text-2xl font-bold md:text-3xl">Nuestra misión</h2>
              <p className="leading-relaxed text-[#8fa0c4]">
                Que nadie pierda su hora de almuerzo en una fila. Preparamos comida
                casera manabita y la ponemos a un par de toques de distancia, con
                precios justos y sin sorpresas al llegar.
              </p>
            </div>
            <div>
              <span className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 text-[#04060f]">
                <Sparkles size={20} />
              </span>
              <h2 className="mb-4 text-2xl font-bold md:text-3xl">Hacia dónde vamos</h2>
              <p className="leading-relaxed text-[#8fa0c4]">
                Queremos que pedir sea tan simple como tener hambre: menú vivo,
                stock real, comprobante digital y tu pedido listo cuando llegas.
              </p>
            </div>
          </div>
        </section>

        {/* Línea de tiempo */}
        <section className="pb-20">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
            El camino hasta aquí
          </h2>
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/60 via-violet-500/40 to-transparent md:left-1/2" />
            <div className="space-y-8">
              {HITOS.map((hito, i) => (
                <div
                  key={hito.year}
                  className={`relative flex flex-col gap-4 pl-14 md:pl-0 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } md:items-center md:gap-10`}
                >
                  <span className="absolute left-3 top-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 ring-4 ring-[#04060f] md:left-1/2 md:-translate-x-1/2" />
                  <div className="tf-glass p-5 md:w-[calc(50%-1.25rem)]">
                    <span className="text-sm font-bold text-cyan-300">{hito.year}</span>
                    <h3 className="mt-1 font-semibold text-[#e8eefc]">{hito.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#8fa0c4]">
                      {hito.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="pb-8">
          <div className="tf-glass tf-glass-edge p-10 text-center md:p-14">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">
              ¿Con hambre? Ya sabes dónde encontrarnos
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[#8fa0c4]">
              Revisa lo que hay disponible hoy y haz tu pedido en menos de un minuto.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/productos" className="tf-btn tf-btn-primary">
                Ver el menú
                <ArrowRight size={17} />
              </Link>
              <Link href="/contacto" className="tf-btn tf-btn-ghost">
                Escríbenos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <TfFooter />
    </div>
  );
}
