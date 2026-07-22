import { createClient } from '@supabase/supabase-js';

import { supabaseKey, supabaseUrl } from './supabase-env';

export const supabase = createClient(supabaseUrl, supabaseKey);
