import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Client navigateur — clé anon uniquement. Lecture seule en pratique :
// toute mutation passe par une Server Action.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
