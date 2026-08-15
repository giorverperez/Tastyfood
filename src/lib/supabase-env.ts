const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl) {
	throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
}

if (!rawSupabaseKey) {
	throw new Error(
		'Missing environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
	);
}

// Se reasignan a constantes tipadas: el `throw` de arriba descarta el
// `undefined` en tiempo de ejecución, pero TypeScript no lo propaga a los
// export, y createClient() rechazaba `string | undefined`.
const supabaseUrl: string = rawSupabaseUrl;
const supabaseKey: string = rawSupabaseKey;

export { supabaseKey, supabaseUrl };