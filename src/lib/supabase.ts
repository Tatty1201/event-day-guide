import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EDG_SUPABASE_URL!,
  process.env.EDG_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.EDG_SUPABASE_URL!,
  process.env.EDG_SUPABASE_SERVICE_ROLE_KEY ?? process.env.EDG_SUPABASE_ANON_KEY!
);

export default supabase;
