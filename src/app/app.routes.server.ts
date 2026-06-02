import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // PLP — Prerender en build time: contenido estático, máximo SEO y velocidad.
    // Angular genera el HTML en el build y lo sirve directamente (como un CDN).
    path: 'productos',
    renderMode: RenderMode.Prerender,
  },
  {
    // PDP — Server-side rendering: la ruta tiene parámetros dinámicos (:id).
    // Prerendering requiere conocer todos los IDs en build time (getPrerenderParams).
    // Con RenderMode.Server, cada request genera el HTML en el servidor al instante.
    // Esto permite contenido personalizado, A/B testing y datos frescos.
    path: 'producto/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Fallback: Server rendering para cualquier otra ruta dinámica
    path: '**',
    renderMode: RenderMode.Server,
  },
];

