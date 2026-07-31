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

  // Deux rôles : admin (présent et actif dans `profils`) ou chauffeur
  // (compte lié via `chauffeurs.user_id`). Sinon déconnexion.
  const { data: profil } = await supabase
    .from("profils")
    .select("id")
    .eq("id", user.id)
    .eq("actif", true)
    .maybeSingle();

  const estEspaceChauffeur = pathname.startsWith("/chauffeur");

  if (profil) {
    return supabaseResponse; // admin : accès à tout
  }

  const { data: chauffeur } = await supabase
    .from("chauffeurs")
    .select("id")
    .eq("user_id", user.id)
    .eq("actif", true)
    .maybeSingle();

  if (chauffeur) {
    // Le chauffeur est confiné à son espace.
    if (estEspaceChauffeur) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/chauffeur";
    url.search = "";
    return NextResponse.redirect(url);
  }

  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = "?erreur=profil";
  return NextResponse.redirect(url);
}
