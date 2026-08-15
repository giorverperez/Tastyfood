'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Edit2,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import TfLayout from '@/components/TfLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  cedula_ruc: string;
  phone: string;
  gender: string;
  birth_date: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Address {
  id: number;
  user_id: string;
  country_id: number;
  province_id: number;
  canton_id: number;
  street_address: string;
  reference: string;
}

const ROLES: Record<string, string> = {
  admin: 'Administrador',
  employee: 'Empleado',
  customer: 'Cliente',
};

export default function PerfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    street: '',
    postal_code: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          street: '',
          postal_code: '',
        });

        // maybeSingle: single() responde HTTP 406 cuando no hay exactamente
        // una fila, y no tener dirección registrada es lo normal.
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!addressError && addressData) {
          setAddress(addressData);
          setEditForm((prev) => ({
            ...prev,
            street: addressData.street_address || '',
            postal_code: addressData.reference || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setMensaje('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, router, loadProfile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (editForm.street) {
        if (address) {
          const { error: addressError } = await supabase
            .from('addresses')
            .update({
              street_address: editForm.street,
              reference: editForm.postal_code,
            })
            .eq('id', address.id);

          if (addressError) throw addressError;
        } else {
          const { error: addressError } = await supabase.from('addresses').insert({
            user_id: user.id,
            street_address: editForm.street,
            reference: editForm.postal_code,
            country_id: 1,
            province_id: 1,
            canton_id: 1,
          });

          if (addressError) throw addressError;
        }
      }

      setMensaje('Perfil actualizado correctamente');
      setEditing(false);
      await loadProfile();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      setMensaje('Error al guardar el perfil');
    } finally {
      setSaving(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <TfLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="tf-glass h-40 animate-pulse" />
          <div className="tf-glass h-80 animate-pulse" />
        </div>
      </TfLayout>
    );
  }

  const nombreCompleto =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Sin nombre registrado';

  const iniciales =
    [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('') || '?';

  const esError = mensaje?.includes('Error');

  return (
    <TfLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">
          Mi <span className="tf-gradient-text">Perfil</span>
        </h1>

        {mensaje && (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-5 py-3.5 text-sm ${
              esError
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-lime-400/30 bg-lime-400/10 text-lime-200'
            }`}
          >
            {mensaje}
          </div>
        )}

        {!profile ? (
          <div className="tf-glass p-14 text-center">
            <p className="mb-7 text-[#8fa0c4]">
              Todavía no encontramos tu perfil. Vuelve a iniciar sesión y, si el
              problema sigue, avisa al administrador.
            </p>
            <Link href="/productos" className="tf-btn tf-btn-primary">
              Ir al menú
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cabecera */}
            <div className="tf-glass tf-glass-edge flex flex-wrap items-center gap-6 p-7">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-2xl font-bold uppercase text-[#04060f]">
                {iniciales}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-bold text-[#e8eefc]">
                  {nombreCompleto}
                </h2>
                <p className="mt-1 truncate text-sm text-[#8fa0c4]">{user.email}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  <ShieldCheck size={12} />
                  {ROLES[profile.role] ?? profile.role}
                </span>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="tf-btn tf-btn-ghost !px-4 !py-2 text-sm"
                >
                  <Edit2 size={15} />
                  Editar
                </button>
              )}
            </div>

            {/* Datos */}
            <div className="tf-glass tf-glass-edge p-7 md:p-8">
              <h3 className="mb-6 text-lg font-bold">Datos personales</h3>

              {editing ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="mb-2 block text-sm text-[#8fa0c4]"
                      >
                        Nombre
                      </label>
                      <input
                        id="first_name"
                        className="tf-input"
                        value={editForm.first_name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last_name"
                        className="mb-2 block text-sm text-[#8fa0c4]"
                      >
                        Apellido
                      </label>
                      <input
                        id="last_name"
                        className="tf-input"
                        value={editForm.last_name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm text-[#8fa0c4]">
                      Teléfono
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="tf-input"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="street"
                        className="mb-2 block text-sm text-[#8fa0c4]"
                      >
                        Dirección
                      </label>
                      <input
                        id="street"
                        className="tf-input"
                        value={editForm.street}
                        onChange={(e) =>
                          setEditForm({ ...editForm, street: e.target.value })
                        }
                        placeholder="Calle y número"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reference"
                        className="mb-2 block text-sm text-[#8fa0c4]"
                      >
                        Referencia
                      </label>
                      <input
                        id="reference"
                        className="tf-input"
                        value={editForm.postal_code}
                        onChange={(e) =>
                          setEditForm({ ...editForm, postal_code: e.target.value })
                        }
                        placeholder="Punto de referencia"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="tf-btn tf-btn-primary flex-1"
                    >
                      <Save size={16} />
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        loadProfile();
                      }}
                      disabled={saving}
                      className="tf-btn tf-btn-ghost flex-1"
                    >
                      <X size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    { Icon: User, label: 'Nombre completo', value: nombreCompleto },
                    { Icon: Mail, label: 'Correo', value: user.email },
                    { Icon: Phone, label: 'Teléfono', value: profile.phone },
                    { Icon: IdCard, label: 'Cédula / RUC', value: profile.cedula_ruc },
                    {
                      Icon: MapPin,
                      label: 'Dirección',
                      value: address?.street_address,
                    },
                    {
                      Icon: Calendar,
                      label: 'Miembro desde',
                      value: profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : null,
                    },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3.5">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs uppercase tracking-wider text-[#5b6b8f]">
                          {label}
                        </dt>
                        <dd className="mt-0.5 break-words text-[#e8eefc]">
                          {value || (
                            <span className="text-[#5b6b8f]">No registrado</span>
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        )}
      </div>
    </TfLayout>
  );
}
