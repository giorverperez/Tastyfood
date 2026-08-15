import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { SITE } from '@/lib/site-config';

/** Footer del tema futurista. Los datos salen de `SITE`, fuente única. */
export default function TfFooter() {
  return (
    <footer className="relative mt-24 border-t border-cyan-400/12">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg">
              🍔
            </span>
            <span className="tf-gradient-text text-xl font-bold">{SITE.name}</span>
          </div>
          <p className="text-sm leading-relaxed text-[#8fa0c4]">
            Llevando los sabores auténticos de Manabí a tu mesa desde {SITE.since}.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { href: SITE.social.facebook, Icon: Facebook, label: 'Facebook' },
              { href: SITE.social.instagram, Icon: Instagram, label: 'Instagram' },
              { href: SITE.social.twitter, Icon: Twitter, label: 'Twitter' },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/20 text-[#8fa0c4] transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Enlaces
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { href: '/productos', label: 'Menú' },
              { href: '/nosotros', label: 'Nosotros' },
              { href: '/contacto', label: 'Contacto' },
              { href: '/pedidos', label: 'Mis Pedidos' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[#8fa0c4] transition-colors hover:text-[#e8eefc]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Horario
          </h3>
          <ul className="space-y-2.5 text-sm text-[#8fa0c4]">
            {SITE.hours.map((h) => (
              <li key={h.days}>
                <span className="block text-[#e8eefc]">{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Contacto
          </h3>
          <ul className="space-y-3 text-sm text-[#8fa0c4]">
            <li className="flex items-start gap-2.5">
              <Phone size={15} className="mt-0.5 shrink-0 text-cyan-400" />
              <span>{SITE.phone}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail size={15} className="mt-0.5 shrink-0 text-cyan-400" />
              <span>{SITE.email}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-cyan-400" />
              <span>{SITE.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cyan-400/12 py-6 text-center text-sm text-[#5b6b8f]">
        © {new Date().getFullYear()} {SITE.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
