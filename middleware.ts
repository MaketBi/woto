import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tout sauf les fichiers statiques :
     * _next/static, _next/image, icônes, manifest, images.
     */
    "/((?!_next/static|_next/image|icon.svg|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
