import { Directive, HostListener, Input, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { AnalyticsService, AnalyticsEventName } from '../../core/services/analytics.service';

/**
 * Directiva `trackEvent`
 *
 * Previene que los eventos de analytics se disparen múltiples veces en una SPA
 * mediante dos mecanismos:
 *   1. throttleTime(500ms): ignora clics repetidos dentro de 500ms
 *   2. takeUntilDestroyed(): limpia la suscripción automáticamente cuando
 *      el componente host es destruido, evitando memory leaks en navegación
 *
 * Uso en template:
 *   <button
 *     trackEvent
 *     [trackEventName]="'add_to_cart'"
 *     [trackEventPayload]="{ item_id: product.id }"
 *   >
 *     Agregar al carrito
 *   </button>
 */
@Directive({
  selector: '[trackEvent]',
  standalone: true,
})
export class TrackEventDirective {
  @Input({ required: true }) trackEventName!: AnalyticsEventName;
  @Input() trackEventPayload: Record<string, unknown> = {};

  private readonly _analytics = inject(AnalyticsService);
  private readonly _destroyRef = inject(DestroyRef);

  // Subject interno: canal de eventos del elemento host
  private readonly _click$ = new Subject<void>();

  constructor() {
    // Configura el pipeline de deduplicación:
    // - throttleTime(500): solo procesa el primer clic en 500ms
    // - takeUntilDestroyed: cancela la suscripción al destruir el componente
    this._click$
      .pipe(
        throttleTime(500, undefined, { leading: true, trailing: false }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(() => {
        this._analytics.track(this.trackEventName, this.trackEventPayload);
      });
  }

  @HostListener('click')
  onClick(): void {
    this._click$.next();
  }
}
