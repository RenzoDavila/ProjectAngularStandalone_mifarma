import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { ProductVariant, Product } from './product-mock.service';

// ─── Domain Models ────────────────────────────────────────────────────────────

/** A single line-item in the shopping cart. */
export interface CartItem {
  readonly product: Product;
  readonly variant: ProductVariant;
  readonly quantity: number;
}

/** Possible statuses of any async cart operation. */
export type CartOperationStatus = 'idle' | 'loading' | 'error';

/** Discriminated type describing the last mutating cart action. */
export type CartOperationType = 'add' | 'remove' | 'update' | null;

/**
 * Immutable snapshot of the shopping cart managed by {@link CartService}.
 * All fields are `readonly` to enforce Signal-driven updates as the single
 * mutation path.
 */
export interface CartState {
  readonly items: ReadonlyArray<CartItem>;
  readonly status: CartOperationStatus;
  readonly errorMessage: string | null;
  readonly lastOperation: CartOperationType;
}

// ─── Mock API ─────────────────────────────────────────────────────────────────

/** Simulated round-trip latency in milliseconds. */
const MOCK_LATENCY_MS = 600 as const;

/** Probability of a simulated network failure (0–1 range). */
const MOCK_ERROR_RATE = 0.1 as const;

/**
 * Simulates an async cart-synchronisation API call.
 *
 * - 90 % probability: resolves after {@link MOCK_LATENCY_MS} ms.
 * - 10 % probability: rejects with a simulated network error after the same latency,
 *   matching realistic failure timing (error arrives after the request completes).
 *
 * In production this would be replaced by an `HttpClient` call.
 *
 * @param _item - Cart item being synchronised (unused in mock; retained for API parity).
 * @returns Observable that either completes or throws a network error.
 */
function simulateCartApiCall(
  _item: CartItem,
): Observable<{ readonly success: true }> {
  if (Math.random() < MOCK_ERROR_RATE) {
    // `timer` + `switchMap` correctly delays the error emission,
    // unlike `throwError().pipe(delay())` which only delays `next` items.
    return timer(MOCK_LATENCY_MS).pipe(
      switchMap(() =>
        throwError(() => new Error('Error de red simulado al sincronizar carrito')),
      ),
    ) as Observable<{ readonly success: true }>;
  }

  return of({ success: true } as const).pipe(delay(MOCK_LATENCY_MS));
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Canonical initial state — immutable reference used for `clearCart`. */
const INITIAL_STATE: CartState = Object.freeze({
  items: [],
  status: 'idle',
  errorMessage: null,
  lastOperation: null,
});

/**
 * Manages the local shopping-cart state using Angular Signals.
 *
 * @description
 * Implements the **Optimistic UI** pattern on every mutation:
 *
 * 1. A pre-mutation snapshot is captured for rollback.
 * 2. The private `_state` Signal is updated immediately — the UI reacts instantly.
 * 3. A mock API call validates the operation asynchronously.
 * 4. On failure, `_rollback` restores the snapshot and surfaces an error message.
 *
 * All public Signals are `readonly` projections of `_state`, enforcing
 * unidirectional data flow and preventing external mutation.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _state = signal<CartState>(INITIAL_STATE);

  // ─── Public read-only Signals ────────────────────────────────────────────

  /** Complete read-only snapshot of the cart state. */
  readonly state = this._state.asReadonly();

  /** Ordered list of items currently in the cart. */
  readonly items = computed(() => this._state().items);

  /** Total number of individual units across all line-items. */
  readonly totalItems = computed(() =>
    this._state().items.reduce((sum, item) => sum + item.quantity, 0),
  );

  /** Subtotal in PEN before taxes or shipping fees. */
  readonly subtotal = computed(() =>
    this._state().items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    ),
  );

  /** Current async-operation status. */
  readonly status = computed(() => this._state().status);

  /** Human-readable error message when `status === 'error'`, otherwise `null`. */
  readonly errorMessage = computed(() => this._state().errorMessage);

  /** `true` while an unrecovered error is active. */
  readonly hasError = computed(() => this._state().status === 'error');

  // ─── Actions ────────────────────────────────────────────────────────────

  /**
   * Adds a product variant to the cart, or increments its quantity if already present.
   * Uses the Optimistic UI pattern with automatic rollback on API failure.
   *
   * @param product - The product being added.
   * @param variant - The selected product variant.
   * @param quantity - Units to add (defaults to `1`).
   */
  addItem(product: Product, variant: ProductVariant, quantity = 1): void {
    const snapshot = this._state();
    this._applyOptimisticAdd(product, variant, quantity);
    this._syncWithApi({ product, variant, quantity }, snapshot);
  }

  /**
   * Removes a specific product variant from the cart.
   * Uses the Optimistic UI pattern with automatic rollback on API failure.
   *
   * @param productId - Identifier of the product to remove.
   * @param variantId - Identifier of the variant to remove.
   */
  removeItem(productId: string, variantId: string): void {
    const snapshot = this._state();

    this._state.update((s) => ({
      ...s,
      items: s.items.filter(
        (i) => !(i.product.id === productId && i.variant.id === variantId),
      ),
      status: 'loading',
      errorMessage: null,
      lastOperation: 'remove',
    }));

    of({ success: true } as const).pipe(delay(400)).subscribe({
      next: () => this._resolveToIdle(),
      error: () => this._rollback(snapshot, 'Error al eliminar el producto.'),
    });
  }

  /**
   * Updates the quantity of an existing cart item.
   * Delegates to `removeItem` when `quantity` drops to zero or below.
   *
   * @param productId - Identifier of the product to update.
   * @param variantId - Identifier of the variant to update.
   * @param quantity - New quantity value. Values ≤ 0 trigger removal.
   */
  updateQuantity(productId: string, variantId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, variantId);
      return;
    }

    const snapshot = this._state();

    this._state.update((s) => ({
      ...s,
      items: s.items.map((item) =>
        item.product.id === productId && item.variant.id === variantId
          ? { ...item, quantity }
          : item,
      ),
      status: 'loading',
      lastOperation: 'update',
    }));

    of({ success: true } as const).pipe(delay(300)).subscribe({
      next: () => this._resolveToIdle(),
      error: () => this._rollback(snapshot, 'Error al actualizar cantidad.'),
    });
  }

  /**
   * Clears the active error message and resets `status` to `idle`.
   * Does **not** revert any item-level changes.
   */
  clearError(): void {
    this._state.update((s) => ({ ...s, status: 'idle', errorMessage: null }));
  }

  /** Empties the cart and resets all state to the initial values. */
  clearCart(): void {
    this._state.set(INITIAL_STATE);
  }

  /**
   * Returns whether a specific product variant is already in the cart.
   *
   * @param productId - Product identifier.
   * @param variantId - Variant identifier.
   * @returns `true` if the combination exists in the cart.
   */
  isInCart(productId: string, variantId: string): boolean {
    return this._state().items.some(
      (i) => i.product.id === productId && i.variant.id === variantId,
    );
  }

  /**
   * Returns the current quantity for a given product-variant pair.
   *
   * @param productId - Product identifier.
   * @param variantId - Variant identifier.
   * @returns Current quantity, or `0` if the item is not present.
   */
  getItemQuantity(productId: string, variantId: string): number {
    return (
      this._state().items.find(
        (i) => i.product.id === productId && i.variant.id === variantId,
      )?.quantity ?? 0
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  /**
   * Applies the optimistic state update for an `add` operation.
   * Increments quantity for existing items; appends a new item otherwise.
   *
   * @param product - Product being added.
   * @param variant - Variant being added.
   * @param quantity - Units to add.
   */
  private _applyOptimisticAdd(
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ): void {
    this._state.update((s) => {
      const existingIndex = this._findItemIndex(s.items, product.id, variant.id);

      const updatedItems: CartItem[] = existingIndex >= 0
        ? s.items.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...s.items, { product, variant, quantity }];

      return {
        ...s,
        items: updatedItems,
        status: 'loading',
        errorMessage: null,
        lastOperation: 'add',
      };
    });
  }

  /**
   * Dispatches the mock API call and wires success/failure handlers.
   *
   * @param item - The cart item to synchronise with the (mock) backend.
   * @param snapshot - Pre-mutation state snapshot used for rollback on error.
   */
  private _syncWithApi(item: CartItem, snapshot: CartState): void {
    simulateCartApiCall(item).subscribe({
      next: () => this._resolveToIdle(),
      error: (err: Error) => {
        console.error('[CartService] Rollback por error de API:', err.message);
        this._rollback(
          snapshot,
          `No pudimos agregar el producto. Intenta de nuevo. (${err.message})`,
        );
      },
    });
  }

  /**
   * Finds the position of a cart item by product and variant identifiers.
   *
   * @param items - The current items array.
   * @param productId - Product identifier to match.
   * @param variantId - Variant identifier to match.
   * @returns Array index, or `-1` if no match is found.
   */
  private _findItemIndex(
    items: ReadonlyArray<CartItem>,
    productId: string,
    variantId: string,
  ): number {
    return items.findIndex(
      (i) => i.product.id === productId && i.variant.id === variantId,
    );
  }

  /** Transitions status to `idle` and clears the last-operation marker. */
  private _resolveToIdle(): void {
    this._state.update((s) => ({ ...s, status: 'idle', lastOperation: null }));
  }

  /**
   * Restores a previous cart state and surfaces a user-visible error message.
   *
   * @param snapshot - The state to restore.
   * @param errorMessage - Human-readable description of the failure.
   */
  private _rollback(snapshot: CartState, errorMessage: string): void {
    this._state.set({
      ...snapshot,
      status: 'error',
      errorMessage,
      lastOperation: null,
    });
  }
}
