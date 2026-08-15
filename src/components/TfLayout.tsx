import TfNavbar from './TfNavbar';
import TfFooter from './TfFooter';

/**
 * Envoltorio del tema futurista: lienzo oscuro + cabecera + pie.
 *
 * Sustituye a `Layout.tsx`, que traía el header claro y un pie con datos de
 * contacto distintos a los de la home.
 */
export default function TfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tf-canvas min-h-screen">
      <TfNavbar />
      <main className="container mx-auto px-4 py-10">{children}</main>
      <TfFooter />
    </div>
  );
}
