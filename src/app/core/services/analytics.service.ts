import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { Subject } from 'rxjs';
import { throttleTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * GA4 eCommerce event names supported by this service.
 * Extends this union to add new event types without modifying existing code (OCP).
 */
export type AnalyticsEventName =
  | 'view_item_list'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search';

/**
 * Strongly-typed GA4 item schema used in eCommerce events.
 * Maps directly to the `items[]` array required by GA4.
 */
export interface AnalyticsItem {
  readonly item_id: string;
  readonly item_name: string;
  readonly price: number;
  readonly index?: number;
  readonly item_variant?: string;
  readonly quantity?: number;
}

/** Internal event envelope flowing through the processing pipeline. */
export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

/**
 * Window type augmentation to avoid `any` when accessing GTM/GA4 globals.
 * Scoped to this module — not exposed to consumers.
 */
interface WindowWithAnalytics extends Window {
  gtag?: (command: 'event', eventName: string, params: Record<string, unknown>) => void;
  dataLayer?: Array<Record<string, unknown>>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Centralised analytics bus following the GA4 eCommerce schema.
 *
 * @description
 * Implements a **pipeline pattern** using RxJS:
 * - `throttleTime(500ms)` prevents duplicate fires on rapid interaction or
 *   accidental double-clicks.
 * - `distinctUntilChanged` suppresses consecutive identical `view_*` events
 *   caused by Signal re-renders unrelated to a product change.
 * - `takeUntilDestroyed` prevents memory leaks when the injector is destroyed.
 * - SSR guard: `window` access is short-circuited in Node.js contexts.
 *
 * @example
 * ```ts
 * analytics.trackViewItem(product.id, product.name, price);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _eventBus$ = new Subject<AnalyticsEvent>();

  /**
   * Signal holding the last dispatched event.
   * Read in DevTools or unit tests without opening the Network tab.
   */
  readonly lastEvent = signal<AnalyticsEvent | null>(null);

  constructor() {
    this._initEventPipeline();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Emits a raw event through the processing pipeline.
   * Prefer typed helpers (`trackViewItem`, `trackAddToCart`, etc.) over this method.
   *
   * @param name - GA4 event name.
   * @param payload - Arbitrary key-value payload forwarded to the provider.
   */
  track(name: AnalyticsEventName, payload: Readonly<Record<string, unknown>> = {}): void {
    this._eventBus$.next({ name, payload, timestamp: Date.now() });
  }

  /**
   * Tracks a GA4 `view_item_list` event when the product grid becomes visible.
   *
   * @param items - Visible products in the list. Only `item_id`, `item_name` and `price`
   *   are required; `index` is computed automatically.
   */
  trackViewItemList(
    items: ReadonlyArray<Pick<AnalyticsItem, 'item_id' | 'item_name' | 'price'>>,
  ): void {
    this.track('view_item_list', {
      item_list_name: 'PLP Farmacia',
      items: items.map((item, index) => ({ ...item, index } satisfies AnalyticsItem)),
    });
  }

  /**
   * Tracks a GA4 `view_item` event when the PDP becomes visible.
   *
   * @param productId - Unique product identifier (stable across sessions).
   * @param productName - Display name shown to the user.
   * @param price - Current sale price in PEN.
   */
  trackViewItem(productId: string, productName: string, price: number): void {
    this.track('view_item', {
      currency: 'PEN',
      value: price,
      items: [{ item_id: productId, item_name: productName, price } satisfies AnalyticsItem],
    });
  }

  /**
   * Tracks a GA4 `add_to_cart` event. Should fire after the optimistic UI
   * update — not after the server confirmation — to reflect perceived user intent.
   *
   * @param productId - Unique product identifier.
   * @param productName - Display name of the product.
   * @param variantLabel - Human-readable variant label (e.g. "Caja x 10 tab").
   * @param price - Unit price in PEN at the time of the action.
   * @param quantity - Number of units being added.
   */
  trackAddToCart(
    productId: string,
    productName: string,
    variantLabel: string,
    price: number,
    quantity: number,
  ): void {
    this.track('add_to_cart', {
      currency: 'PEN',
      value: price * quantity,
      items: [{
        item_id: productId,
        item_name: productName,
        item_variant: variantLabel,
        price,
        quantity,
      } satisfies AnalyticsItem],
    });
  }

  /**
   * Tracks a GA4 `search` event after the user submits a query.
   *
   * @param query - Raw search term entered by the user.
   * @param resultCount - Total number of results returned.
   */
  trackSearch(query: string, resultCount: number): void {
    this.track('search', { search_term: query, results_count: resultCount });
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Wires the RxJS processing pipeline.
   * Called once from the constructor; `takeUntilDestroyed` ensures the
   * subscription is cleaned up when the root injector is destroyed.
   */
  private _initEventPipeline(): void {
    this._eventBus$.pipe(
      throttleTime(500, undefined, { leading: true, trailing: false }),
      distinctUntilChanged(this._isSameViewEvent),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe((event) => {
      this.lastEvent.set(event);
      this._dispatchToProvider(event);
    });
  }

  /**
   * Comparator passed to `distinctUntilChanged`.
   *
   * Returns `true` (suppress) only when both events are `view_*` events for the
   * same product. Interaction events (`add_to_cart`, etc.) are always forwarded.
   *
   * @param previous - The last dispatched event.
   * @param current - The candidate event to dispatch.
   * @returns `true` if the current event is a duplicate and should be dropped.
   */
  private readonly _isSameViewEvent = (
    previous: AnalyticsEvent,
    current: AnalyticsEvent,
  ): boolean => {
    if (!current.name.startsWith('view_')) return false;
    if (previous.name !== current.name) return false;

    const prevId = (previous.payload['items'] as ReadonlyArray<AnalyticsItem> | undefined)?.[0]?.item_id;
    const currId = (current.payload['items'] as ReadonlyArray<AnalyticsItem> | undefined)?.[0]?.item_id;

    return prevId === currId;
  };

  /**
   * Forwards the processed event to the configured analytics provider.
   *
   * Priority:
   * 1. `window.gtag()` — Google Analytics 4 direct integration.
   * 2. `window.dataLayer.push()` — Google Tag Manager.
   *
   * In SSR (Node.js), `window` is `undefined` and this method is a no-op.
   *
   * @param event - The fully processed event ready for dispatch.
   */
  private _dispatchToProvider(event: AnalyticsEvent): void {
    if (typeof window === 'undefined') return;

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.group(`[Analytics] ${event.name}`);
      console.log('Payload:', event.payload);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.groupEnd();
    }

    const win = window as WindowWithAnalytics;

    if (typeof win.gtag === 'function') {
      win.gtag('event', event.name, { ...event.payload });
    } else if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: event.name, ...event.payload });
    }
  }
}
