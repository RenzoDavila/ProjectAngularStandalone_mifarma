import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withViewTransitions,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ─── Router ─────────────────────────────────────────────────────────
    // withViewTransitions: habilita la View Transitions API nativa del browser.
    // Permite que la imagen del producto en la grilla "vuele" hacia la PDP
    // usando `view-transition-name` en CSS — sin una línea de JS adicional.
    //
    // withComponentInputBinding: bindea automáticamente los route params
    // como @Input() del componente (ej: @Input() id: string).
    //
    // withInMemoryScrolling: restaura el scroll al navegar hacia atrás.
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),

    // ─── SSR Hydration ───────────────────────────────────────────────────
    // withEventReplay: captura los eventos del usuario antes de que
    // Angular hidrate el DOM (crítico en SSR para evitar clics perdidos).
    provideClientHydration(withEventReplay()),

    // ─── HTTP ────────────────────────────────────────────────────────────
    // withFetch: usa la Fetch API nativa en lugar de XMLHttpRequest,
    // compatible con Node.js 18+ para SSR sin polyfills adicionales.
    provideHttpClient(withFetch()),

    // ─── Animations ──────────────────────────────────────────────────────
    provideAnimationsAsync(),
  ],
};
