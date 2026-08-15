'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    cedula_ruc: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // Estos datos viajan como metadata del usuario; el trigger
      // `on_auth_user_created` los copia a la tabla `profiles`.
      const needsConfirmation = await signUp(form.email, form.password, {
        first_name: form.first_name,
        last_name: form.last_name,
        cedula_ruc: form.cedula_ruc,
        phone: form.phone,
        gender: '',
        birth_date: '',
      });

      if (needsConfirmation) {
        // Con confirmación de correo activada no hay sesión todavía:
        // enviar a /login sin avisar deja al usuario sin saber qué pasó.
        setSuccess(
          `Te enviamos un correo a ${form.email}. Confírmalo para activar tu cuenta.`
        );
        return;
      }

      router.push('/');
    } catch (err: unknown) {
      console.error('Error en registro:', err);

      const message = (err as { message?: string })?.message ?? '';

      if (message.includes('Invalid API key')) {
        setError('Error de configuración. Contacta al administrador.');
      } else if (message.includes('User already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else if (message.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (message.includes('Invalid email')) {
        setError('Por favor, ingresa un correo electrónico válido.');
      } else if (message) {
        setError(`Error: ${message}`);
      } else {
        setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de confirmación: sustituye al formulario para que quede claro
  // que la cuenta existe pero falta el paso del correo.
  if (success) {
    return (
      <div className="tf-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="tf-glass tf-glass-edge tf-glow-cyan w-full max-w-md p-10 text-center">
          <span className="tf-float mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-lime-400 text-[#04060f]">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mb-3 text-2xl font-bold">Revisa tu correo</h1>
          <p className="mb-8 leading-relaxed text-[#8fa0c4]">{success}</p>
          <Link href="/login" className="tf-btn tf-btn-primary w-full">
            Ir a iniciar sesión
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[#8fa0c4] transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={15} />
        Volver al inicio
      </Link>

      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="tf-float relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-400 text-3xl">
            🍔
            <span className="tf-pulse-ring absolute inset-0 rounded-2xl border border-violet-300/60" />
          </span>
          <h1 className="text-3xl font-bold">
            Crea tu <span className="tf-gradient-text">cuenta</span>
          </h1>
          <p className="mt-2.5 text-[#8fa0c4]">
            Pide en segundos y guarda el historial de tus comprobantes
          </p>
        </div>

        <div className="tf-glass tf-glass-edge tf-glow-cyan p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="mb-2 block text-sm text-[#8fa0c4]">
                  Nombre
                </label>
                <div className="relative">
                  <User
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
                  />
                  <input
                    id="first_name"
                    required
                    value={form.first_name}
                    onChange={update('first_name')}
                    className="tf-input pl-11"
                    placeholder="Juan"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="last_name" className="mb-2 block text-sm text-[#8fa0c4]">
                  Apellido
                </label>
                <input
                  id="last_name"
                  required
                  value={form.last_name}
                  onChange={update('last_name')}
                  className="tf-input"
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="cedula_ruc" className="mb-2 block text-sm text-[#8fa0c4]">
                  Cédula / RUC
                </label>
                <div className="relative">
                  <IdCard
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
                  />
                  <input
                    id="cedula_ruc"
                    inputMode="numeric"
                    value={form.cedula_ruc}
                    onChange={update('cedula_ruc')}
                    className="tf-input pl-11"
                    placeholder="1300000000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm text-[#8fa0c4]">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b6b8f]"
                  />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    className="tf-input pl-11"
                    placeholder="0999999999"
                  />
                </div>
              </div>
            </div>

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
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  className="tf-input pl-11"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={update('password')}
                    className="tf-input pl-11 pr-11"
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm text-[#8fa0c4]"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  className="tf-input"
                  placeholder="Repite la contraseña"
                />
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
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              {!isLoading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/25" />
            <span className="text-xs uppercase tracking-wider text-[#5b6b8f]">
              ¿Ya tienes cuenta?
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/25" />
          </div>

          <Link href="/login" className="tf-btn tf-btn-ghost w-full">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
