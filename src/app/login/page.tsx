'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: unknown) {
      // Un correo sin confirmar no es una credencial incorrecta: decirlo así
      // hace que el usuario reintente la contraseña sin llegar a nada.
      const message = (err as { message?: string })?.message ?? '';

      if (message.includes('Email not confirmed')) {
        setError('Tu correo aún no está confirmado. Revisa tu bandeja de entrada.');
      } else if (message.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tf-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[#8fa0c4] transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={15} />
        Volver al inicio
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="tf-float relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-3xl">
            🍔
            <span className="tf-pulse-ring absolute inset-0 rounded-2xl border border-cyan-300/60" />
          </span>
          <h1 className="text-3xl font-bold">
            Bienvenido de <span className="tf-gradient-text">vuelta</span>
          </h1>
          <p className="mt-2.5 text-[#8fa0c4]">Entra para continuar con tu pedido</p>
        </div>

        <div className="tf-glass tf-glass-edge tf-glow-violet p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-[#8fa0c4]">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tf-input pl-11"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-[#8fa0c4]">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tf-input pl-11 pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f] transition-colors hover:text-cyan-300"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="tf-btn tf-btn-primary w-full"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              {!isLoading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/25" />
            <span className="text-xs uppercase tracking-wider text-[#5b6b8f]">
              ¿No tienes cuenta?
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/25" />
          </div>

          <Link href="/registro" className="tf-btn tf-btn-ghost w-full">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
