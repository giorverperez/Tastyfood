 import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Horario</h3>
              <p>Lunes a Viernes: 11:00 - 22:00</p>
              <p>Sábados y Domingos: 12:00 - 23:00</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <p>Teléfono: (123) 456-7890</p>
              <p>Email: info@tastyfood.com</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Síguenos</h3>
              <div className="flex gap-4">
                <a href="#" className="hover:text-blue-400 transition-colors">Facebook</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Instagram</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}