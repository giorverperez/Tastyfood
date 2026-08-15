'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserProfile = {
  first_name: string;
  last_name: string;
  cedula_ruc: string;
  phone: string;
  gender: string;
  birth_date: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Devuelve true si Supabase exige confirmar el correo antes de entrar. */
  signUp: (email: string, password: string, profileData: UserProfile) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Error de autenticación:", error.message);
        throw error;
      }
    } catch (err: unknown) {
      console.error("Error inesperado:", err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, profileData: UserProfile) => {
    try {
      // El perfil NO se inserta desde aquí: la confirmación de correo está
      // activada, así que tras signUp todavía no hay sesión y cualquier insert
      // se rechazaría por RLS. Los datos viajan como metadata y el trigger
      // `on_auth_user_created` crea la fila en `profiles` con role 'customer'.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { ...profileData },
        },
      });

      if (error) {
        console.error("Error de registro:", error.message);
        throw error;
      }

      // Sin sesión = Supabase envió un correo de confirmación.
      return !data.session;
    } catch (err: unknown) {
      console.error("Error inesperado en registro:", err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}