'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, Menu, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

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

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { totalItems } = useCart();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    street: '',
    postal_code: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Cargar perfil del usuario
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
          postal_code: ''
        });

        // Cargar dirección si existe
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!addressError && addressData) {
          setAddress(addressData);
          setEditForm(prev => ({
            ...prev,
            street: addressData.street_address || '',
            postal_code: addressData.reference || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setMensaje('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    try {
      setSaving(true);
      
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Actualizar o crear dirección si se proporcionó información
      if (editForm.street) {
        if (address) {
          // Actualizar dirección existente
          const { error: addressError } = await supabase
            .from('addresses')
            .update({
              street_address: editForm.street,
              reference: editForm.postal_code
            })
            .eq('id', address.id);

          if (addressError) throw addressError;
        } else {
          // Crear nueva dirección
          const { error: addressError } = await supabase
            .from('addresses')
            .insert({
              user_id: user.id,
              street_address: editForm.street,
              reference: editForm.postal_code,
              country_id: 1, // Default Ecuador
              province_id: 1, // Default
              canton_id: 1 // Default
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg py-4">
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
              <span className="text-3xl">🍔</span>
              <span>TastyFood</span>
            </Link>
            
            {/* Menú de escritorio */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/productos" className="font-medium hover:text-blue-600 transition-colors">
                Menú
              </Link>
              <Link href="/nosotros" className="font-medium hover:text-blue-600 transition-colors">
                Nosotros
              </Link>
              <Link href="/ubicaciones" className="font-medium hover:text-blue-600 transition-colors">
                Ubicaciones
              </Link>
              <Link href="/contacto" className="font-medium hover:text-blue-600 transition-colors">
                Contacto
              </Link>
              <Link href="/carrito" className="relative flex items-center font-medium hover:text-blue-600 transition-colors">
                <ShoppingCart className="mr-1" size={18} />
                Carrito
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              {user ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1">
                    Mi Cuenta
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full w-48 bg-transparent rounded-md shadow-lg z-10">
                      <Link href="/perfil" className="block bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Mi Perfil
                      </Link>
                      <Link href="/pedidos" className="block bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Mis Pedidos
                      </Link>
                      <button 
                         onClick={async () => {
                           await signOut();
                           router.push('/');
                         }}
                         className="block bg-red-600 w-full text-left px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors rounded-b-lg"
                       >
                         Cerrar Sesión
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
            
            {/* Botón de menú móvil */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="flex flex-col p-4 space-y-4">
                <Link 
                  href="/productos" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Menú
                </Link>
                <Link 
                  href="/nosotros" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Nosotros
                </Link>
                <Link 
                  href="/ubicaciones" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ubicaciones
                </Link>
                <Link 
                  href="/contacto" 
                  className="font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contacto
                </Link>
                <Link 
                  href="/carrito" 
                  className="flex items-center font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="mr-1" size={18} />
                  Carrito {totalItems > 0 && `(${totalItems})`}
                </Link>
                {user ? (
                  <div className="space-y-2">
                    <Link href="/perfil" className="block font-medium hover:text-blue-600 transition-colors">
                      Mi Perfil
                    </Link>
                    <Link href="/pedidos" className="block font-medium hover:text-blue-600 transition-colors">
                      Mis Pedidos
                    </Link>
                    <button 
                      onClick={async () => {
                        await signOut();
                        router.push('/');
                      }}
                      className="block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Mi Perfil'}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  setEditForm({
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    phone: profile?.phone || '',
                    street: address?.street_address || '',
                    postal_code: address?.reference || ''
                  });
                } else {
                  setEditing(true);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editing ? <X size={16} /> : <Edit2 size={16} />}
              <span>{editing ? 'Cancelar' : 'Editar'}</span>
            </button>
          </div>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg ${mensaje.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {mensaje}
          </div>
        )}

        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Información Personal
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile?.first_name || 'No especificado'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile?.last_name || 'No especificado'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="mr-1" size={16} />
                Email
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Phone className="mr-1" size={16} />
                Teléfono
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile?.phone || 'No especificado'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cédula/RUC
              </label>
              <p className="text-gray-900">{profile?.cedula_ruc || 'No especificado'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="mr-1" size={16} />
                Fecha de Nacimiento
              </label>
              <p className="text-gray-900">
                {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="mr-2" size={20} />
            Dirección
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calle
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.street}
                  onChange={(e) => setEditForm(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{address?.street_address || 'No especificado'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.postal_code}
                  onChange={(e) => setEditForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Cerca del parque, frente a la farmacia"
                />
              ) : (
                <p className="text-gray-900">{address?.reference || 'No especificado'}</p>
              )}
            </div>
          </div>
          
          {editing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}