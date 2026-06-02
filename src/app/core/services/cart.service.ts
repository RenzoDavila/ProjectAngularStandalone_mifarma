import {
  Injectable,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Observable, throwError, of, delay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductVariant, Product } from './product-mock.service';

// ─────────────────────────────────────────────
// DOMAIN MODELS
// ─────────────────────────────────────────────
export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  status: 'idle' | 'loading' | 'error';
  errorMessage: string | null;
  lastOperation: 'add' | 'remove' | 'update' | null;
}

// ─────────────────────────────────────────────
// MOCK API STUB
// Simula la latencia de red y un 10% de error
// ─────────────────────────────────────────────
function mockCartApi(item: CartItem): Observable<{ success: boolean }> {
  const willFail = Math.random() < 0.1; // 10% probabilidad de error

  if (willFail) {
    return throwError(() => new Error('Error de red simulado al sincronizar carrito')).pipe(
      // Simula latencia antes del error
      // (en producción: HttpClient + interceptor de error)
    );
  }

  return of({ success: true }).pipe(delay(600));
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CartService {
  // ─────────────────────────────────────────
  // STATE (private Signal — fuente única de verdad)
  // ─────────────────────────────────────────
  private readonly _state = signal<CartState>({
    items: [],
    status: 'idle',
    errorMessage: null,
    lastOperation: null,
  });

  // ─────────────────────────────────────────
  // PUBLIC READ-ONLY SIGNALS (Derived / Computed)
  // ─────────────────────────────────────────

  /** Snapshot público del estado completo */
  readonly state = this._state.asReadonly();

  /** Lista de ítems en el carrito */
  readonly items = computed(() => this._state().items);

  /** Total de artículos (suma de quantities) */
  readonly totalItems = computed(() =>
    this._state().items.reduce((sum, item) => sum + item.quantity, 0)
  );

  /** Subtotal monetario */
  readonly subtotal = computed(() =>
    this._state().items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    )
  );

  /** Estado de carga/error para la UI */
  readonly status = computed(() => this._state().status);
  readonly errorMessage = computed(() => this._state().errorMessage);

  /** ¿Hay algún error activo? */
  readonly hasError = computed(() => this._state().status === 'error');

  // ─────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────

  /**
   * OPTIMISTIC UI ADD
   *
   * Flujo:
   *   1. Guarda snapshot del estado actual (para rollback)
   *   2. Actualiza el Signal INMEDIATAMENTE (UI reacciona al instante)
   *   3. Lanza petición asíncrona al mock API
   *   4a. Éxito → confirma, limpia estado de carga
   *   4b. Error → ROLLBACK al snapshot, emite error en el Signal
   */
  addItem(product: Product, variant: ProductVariant, quantity = 1): void {
    // 1. Snapshot para rollback
    const previousState = this._state();

    // 2. Actualización optimista
    this._state.update((s) => {
      const existingIndex = s.items.findIndex(
        (i) => i.product.id === product.id && i.variant.id === variant.id
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        newItems = s.items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...s.items, { product, variant, quantity }];
      }

      return {
        ...s,
        items: newItems,
        status: 'loading',
        errorMessage: null,
        lastOperation: 'add',
      };
    });

    // 3. Llamada asíncrona al API mock
    const newItem: CartItem = { product, variant, quantity };

    mockCartApi(newItem).subscribe({
      next: () => {
        // 4a. Éxito → solo actualizamos el status, el estado ya es correcto
        this._state.update((s) => ({
          ...s,
          status: 'idle',
          lastOperation: null,
        }));
      },
      error: (err: Error) => {
        // 4b. Error → ROLLBACK al snapshot anterior
        console.error('[CartService] Rollback por error de API:', err.message);
        this._state.set({
          ...previousState,
          status: 'error',
          errorMessage: `No pudimos agregar el producto. Intenta de nuevo. (${err.message})`,
          lastOperation: null,
        });
      },
    });
  }

  /**
   * OPTIMISTIC UI REMOVE
   * Mismo patrón: optimistic update → API call → rollback on error
   */
  removeItem(productId: string, variantId: string): void {
    const previousState = this._state();

    this._state.update((s) => ({
      ...s,
      items: s.items.filter(
        (i) => !(i.product.id === productId && i.variant.id === variantId)
      ),
      status: 'loading',
      errorMessage: null,
      lastOperation: 'remove',
    }));

    // Stub: en producción sería un HttpClient.delete(...)
    of({ success: true })
      .pipe(delay(400))
      .subscribe({
        next: () =>
          this._state.update((s) => ({ ...s, status: 'idle', lastOperation: null })),
        error: () => this._state.set({ ...previousState, status: 'error', errorMessage: 'Error al eliminar el producto.', lastOperation: null }),
      });
  }

  /**
   * Actualiza la cantidad de un ítem existente
   */
  updateQuantity(productId: string, variantId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, variantId);
      return;
    }

    const previousState = this._state();

    this._state.update((s) => ({
      ...s,
      items: s.items.map((item) =>
        item.product.id === productId && item.variant.id === variantId
          ? { ...item, quantity }
          : item
      ),
      status: 'loading',
      lastOperation: 'update',
    }));

    of({ success: true })
      .pipe(delay(300))
      .subscribe({
        next: () =>
          this._state.update((s) => ({ ...s, status: 'idle', lastOperation: null })),
        error: () =>
          this._state.set({ ...previousState, status: 'error', errorMessage: 'Error al actualizar cantidad.', lastOperation: null }),
      });
  }

  /** Limpia el mensaje de error sin revertir el estado */
  clearError(): void {
    this._state.update((s) => ({ ...s, status: 'idle', errorMessage: null }));
  }

  /** Vacía el carrito */
  clearCart(): void {
    this._state.set({
      items: [],
      status: 'idle',
      errorMessage: null,
      lastOperation: null,
    });
  }

  /** Verifica si un producto/variante ya está en el carrito */
  isInCart(productId: string, variantId: string): boolean {
    return this._state().items.some(
      (i) => i.product.id === productId && i.variant.id === variantId
    );
  }

  /** Retorna la cantidad actual de un ítem específico */
  getItemQuantity(productId: string, variantId: string): number {
    return (
      this._state().items.find(
        (i) => i.product.id === productId && i.variant.id === variantId
      )?.quantity ?? 0
    );
  }
}
