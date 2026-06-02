import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { throttleTime, distinctUntilChanged } from 'rxjs/operators';

// ─────────────────────────────────────────────
// TIPOS DE EVENTOS (GA4 / GTM eCommerce Schema)
// ─────────────────────────────────────────────
export type AnalyticsEventName =
  | 'view_item_list'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  payload: Record<string, unknown>;
  timestamp: number;
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  /**
   * Subject interno que actúa como bus de eventos.
   * El throttle previene disparos múltiples por clics accidentales.
   * En producción, se conecta a window.gtag() o window.dataLayer.push().
   */
  private readonly _eventBus$ = new Subject<AnalyticsEvent>();

  /** Signal con el último evento enviado (útil para debug en DevTools) */
  readonly lastEvent = signal<AnalyticsEvent | null>(null);

  constructor() {
    // Escucha el bus con throttle de 500ms por tipo de evento
    // para prevenir doble-click accidentales o renders duplicados (SSR + Client hydration)
    this._eventBus$
      .pipe(
        throttleTime(500, undefined, { leading: true, trailing: false })
      )
      .subscribe((event) => {
        this.lastEvent.set(event);
        this._dispatch(event);
      });
  }

  /**
   * Emite un evento al bus (con throttle automático).
   * Uso: analyticsService.track('add_to_cart', { item_id: '...' });
   */
  track(name: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
    this._eventBus$.next({ name, payload, timestamp: Date.now() });
  }

  /**
   * ─────────────────────────────────────────────────────────
   * DISPATCH REAL hacia el proveedor de analytics
   *
   * En producción este método enviaría a:
   *   - Google Analytics 4: window.gtag('event', name, payload)
   *   - GTM dataLayer:      window.dataLayer.push({ event: name, ...payload })
   *   - Segment:            analytics.track(name, payload)
   *
   * El guard typeof window !== 'undefined' es CRÍTICO en SSR:
   * Angular Universal ejecuta código en Node.js donde `window` no existe.
   * ─────────────────────────────────────────────────────────
   */
  private _dispatch(event: AnalyticsEvent): void {
    if (typeof window === 'undefined') return; // Guard SSR

    // Debug mode (solo en desarrollo)
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.group(`[Analytics] ${event.name}`);
      console.log('Payload:', event.payload);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.groupEnd();
    }

    // GA4 Integration (cuando se implemente GTM real)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof win.gtag === 'function') {
      win.gtag('event', event.name, event.payload);
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: event.name, ...event.payload });
    }
  }

  // ─────────────────────────────────────────
  // HELPERS TIPADOS PARA CADA EVENTO GA4
  // ─────────────────────────────────────────

  trackViewItemList(items: { id: string; name: string; price: number }[]): void {
    this.track('view_item_list', {
      item_list_name: 'PLP Farmacia',
      items: items.map((i, idx) => ({ item_id: i.id, item_name: i.name, price: i.price, index: idx })),
    });
  }

  trackViewItem(productId: string, productName: string, price: number): void {
    this.track('view_item', {
      currency: 'PEN',
      value: price,
      items: [{ item_id: productId, item_name: productName, price }],
    });
  }

  trackAddToCart(productId: string, productName: string, variantLabel: string, price: number, quantity: number): void {
    this.track('add_to_cart', {
      currency: 'PEN',
      value: price * quantity,
      items: [{ item_id: productId, item_name: productName, item_variant: variantLabel, price, quantity }],
    });
  }

  trackSearch(query: string, results: number): void {
    this.track('search', { search_term: query, results_count: results });
  }
}
