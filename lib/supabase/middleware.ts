import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// Routes accessibles sans session : connexion et consultation publique.
const estRoutePublique = (pathname: string) =>
  pathname === "/connexion" ||
  pathname.startsWith("/connexion/") ||
  pathname.startsWith("/p/");

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ne rien insérer entre createServerClient et getUser : le refresh de
  // session dépend de cet appel.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (estRoutePublique(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // L'utilisateur doit exister et être actif dans `profils` ; sinon déconnexion.
  // (La policy RLS ne laisse lire profils qu'aux admins actifs : un compte
  // orphelin ou désactivé ne verra pas sa propre ligne.)
  const { data: profil } = await supabase
    .from("profils")
    .select("id")
    .eq("id", user.id)
    .eq("actif", true)
    .maybeSingle();

  if (!profil) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "?erreur=profil";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
