'use client';

import { useState } from 'react';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import TfNavbar from '@/components/TfNavbar';
import TfFooter from '@/components/TfFooter';
import { SITE } from '@/lib/site-config';

export default function ContactoPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // No existe tabla de mensajes en la base, así que el formulario NO simula
  // un envío que no ocurre: abre el correo con todo ya redactado.
  // Si más adelante quieres guardarlos, hace falta crear la tabla `mensajes`
  // y cambiar este handler por un insert de Supabase.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cuerpo = [`Nombre: ${nombre}`, `Correo: ${email}`, '', mensaje].join('\n');

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(
      asunto || `Contacto desde la web — ${nombre}`
    )}&body=${encodeURIComponent(cuerpo)}`;
  };

  const datos = [
    { Icon: Phone, label: 'Teléfono', value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, '')}` },
    { Icon: Mail, label: 'Correo', value: SITE.email, href: `mailto:${SITE.email}` },
    { Icon: MapPin, label: 'Dirección', value: SITE.address, href: null },
    { Icon: Clock, label: 'Horario', value: `${SITE.hours[0].days}: ${SITE.hours[0].time}`, href: null },
  ];

  return (
    <div className="tf-canvas min-h-screen">
      <TfNavbar />

      <main className="container mx-auto px-4">
        <section className="py-20 text-center md:py-24">
          <span className="tf-glass inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cyan-300">
            <Send size={13} />
            Contacto
          </span>
          <h1 className="mx-auto mt-7 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Hablemos de <span className="tf-gradient-text">comida</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#8fa0c4]">
            Pedidos grandes, sugerencias o dudas sobre tu comprobante: escríbenos y
            te respondemos en horario de atención.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-20 lg:grid-cols-5">
          {/* Datos */}
          <div className="space-y-4 lg:col-span-2">
            {datos.map(({ Icon, label, value, href }) => (
              <div key={label} className="tf-glass flex items-start gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-[#5b6b8f]">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="break-words font-medium text-[#e8eefc] transition-colors hover:text-cyan-300"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="break-words font-medium text-[#e8eefc]">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div className="tf-glass tf-glass-edge p-7 md:p-9 lg:col-span-3">
            <h2 className="mb-1.5 text-xl font-bold">Envíanos un mensaje</h2>
            <p className="mb-7 text-sm text-[#8fa0c4]">
              Al enviar se abrirá tu correo con el mensaje ya redactado.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className="mb-2 block text-sm text-[#8fa0c4]">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    className="tf-input"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-[#8fa0c4]">
                    Correo
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="tf-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="asunto" className="mb-2 block text-sm text-[#8fa0c4]">
                  Asunto
                </label>
                <input
                  id="asunto"
                  className="tf-input"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="¿De qué se trata?"
                />
              </div>

              <div>
                <label htmlFor="mensaje" className="mb-2 block text-sm text-[#8fa0c4]">
                  Mensaje
                </label>
                <textarea
                  id="mensaje"
                  className="tf-input min-h-36 resize-y"
                  required
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos..."
                />
              </div>

              <button type="submit" className="tf-btn tf-btn-primary w-full">
                Enviar mensaje
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <TfFooter />
    </div>
  );
}
