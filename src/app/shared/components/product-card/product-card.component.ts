import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { Product, ProductVariant } from '../../../core/services/product-mock.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, CurrencyPipe],
  template: `
    <article
      class="product-card"
      [attr.aria-label]="'Producto: ' + product.name"
    >
      <!-- ─── Imagen con View Transition ─────────────────────────────── -->
      <!-- view-transition-name único por producto:
           Cuando el usuario navega a la PDP, el browser morfea esta imagen
           hacia la imagen principal de la PDP automáticamente. -->
      <a
        [routerLink]="['/producto', product.id]"
        class="product-card__image-link"
        (click)="onViewItem()"
        [attr.aria-label]="'Ver detalle de ' + product.name"
      >
        <div class="product-card__image-wrapper">
          @if (product.imageUrl) {
            <img
              [ngSrc]="product.imageUrl"
              [alt]="product.name"
              width="280"
              height="280"
              class="product-card__image product-image-transition"
              [style.view-transition-name]="'product-' + product.id"
              loading="lazy"
            />
          } @else {
            <div class="product-card__image-placeholder" aria-hidden="true"></div>
          }

          @if (discountPercent > 0) {
            <span class="product-card__badge product-card__badge--discount" aria-label="Descuento">
              -{{ discountPercent }}%
            </span>
          }

          @if (product.prescription) {
            <span class="product-card__badge product-card__badge--rx" title="Requiere receta médica">
              Rx
            </span>
          }
        </div>
      </a>

      <!-- ─── Info del Producto ─────────────────────────────────────── -->
      <div class="product-card__body">
        <p class="product-card__brand">{{ product.brand }}</p>
        <h3 class="product-card__name">
          <a
            [routerLink]="['/producto', product.id]"
            (click)="onViewItem()"
            [title]="product.name"
          >
            {{ product.name }}
          </a>
        </h3>

        <!-- Rating -->
        <div class="product-card__rating" [attr.aria-label]="product.rating + ' de 5 estrellas'">
          @for (star of stars; track $index) {
            <span class="product-card__star" [class.product-card__star--filled]="star <= product.rating" aria-hidden="true">★</span>
          }
          <span class="product-card__review-count">({{ product.reviewCount }})</span>
        </div>

        <!-- Precio de la variante por defecto -->
        <div class="product-card__price-wrapper">
          @if (selectedVariant.originalPrice) {
            <s class="product-card__price-old" aria-label="Precio anterior">
              {{ selectedVariant.originalPrice | currency:'PEN':'symbol':'1.2-2' }}
            </s>
          }
          <p class="product-card__price" aria-label="Precio actual">
            {{ selectedVariant.price | currency:'PEN':'symbol':'1.2-2' }}
          </p>
        </div>

        <!-- CTA -->
        <button
          class="product-card__cta btn btn--primary"
          id="add-to-cart-{{ product.id }}"
          (click)="onAddToCart()"
          [attr.aria-label]="'Agregar ' + product.name + ' al carrito'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Agregar
        </button>
      </div>
    </article>
  `,
  styles: [`
    .product-card {
      background: var(--color-bg-card);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      /* ── Altura fija: todos los cards idénticos sin excepción ── */
      height: 420px;
      max-height: 420px;
      transition: box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1),
                  transform 250ms cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: var(--shadow-card-hover);
        transform: translateY(-2px);
      }
    }

    .product-card__image-link {
      display: block;
      text-decoration: none;
    }

    .product-card__image-wrapper {
      position: relative;
      /* Altura fija — reemplaza aspect-ratio para que no varíe
         según el ancho del contenedor en distintos breakpoints */
      height: 180px;
      flex-shrink: 0;
      background: hsl(210, 16%, 96%);
      overflow: hidden;
    }

    .product-card__image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 0.5rem;
      transition: transform 300ms ease;

      .product-card:hover & {
        transform: scale(1.04);
      }
    }

    .product-card__image-placeholder {
      width: 100%;
      height: 100%;
      background: var(--color-border);
    }

    .product-card__badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1.4;
    }

    .product-card__badge--discount {
      background: var(--color-error);
      color: white;
    }

    .product-card__badge--rx {
      background: var(--color-brand-primary);
      color: white;
      top: auto;
      left: auto;
      right: 0.5rem;
      bottom: 0.5rem;
    }

    .product-card__body {
      padding: var(--spacing-card-padding);
      display: flex;
      flex-direction: column;
      flex: 1;
      /* min-height:0 permite que flexbox comprima el body
         sin desbordar el height fijo del card padre */
      min-height: 0;
      overflow: hidden;
      gap: 0.25rem;
    }

    .product-card__brand {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
    }

    .product-card__name {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-text-primary);
      margin-bottom: 0.25rem;
      /* ── Altura fija para 2 líneas → todos los cards se alinean ── */
      height: calc(0.875rem * 1.3 * 2); /* 2 líneas exactas */
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      a {
        color: inherit;
        text-decoration: none;
        /* El title nativo del <a> actúa como tooltip en todos los browsers */
      }
      a:hover { color: var(--color-brand-primary); }
    }

    .product-card__rating {
      display: flex;
      align-items: center;
      gap: 1px;
      margin-bottom: 0.25rem;
    }

    .product-card__star {
      color: var(--color-border);
      font-size: 0.8rem;

      &--filled { color: hsl(45, 96%, 48%); }
    }

    .product-card__review-count {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      margin-left: 0.25rem;
    }

    .product-card__price-wrapper {
      margin-top: auto;
      margin-bottom: 0.75rem;
    }

    .product-card__price-old {
      font-size: 0.75rem;
      color: var(--color-text-price-old);
      display: block;
    }

    .product-card__price {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-price);
    }

    .product-card__cta {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: var(--color-brand-accent);
      color: white;
      border-radius: var(--radius-button);
      font-size: 0.875rem;
      font-weight: 600;
      transition: background 200ms ease, transform 150ms ease;

      &:hover {
        background: var(--color-brand-accent-hover);
        transform: scale(1.02);
      }

      &:active { transform: scale(0.98); }
    }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() selectedVariant!: ProductVariant;
  @Output() addToCart = new EventEmitter<{ product: Product; variant: ProductVariant }>();

  private analytics = inject(AnalyticsService);

  readonly stars = [1, 2, 3, 4, 5];

  get discountPercent(): number {
    const v = this.selectedVariant ?? this.product.variants[0];
    if (!v?.originalPrice) return 0;
    return Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100);
  }

  onAddToCart(): void {
    const variant = this.selectedVariant ?? this.product.variants[0];
    this.addToCart.emit({ product: this.product, variant });
    this.analytics.trackAddToCart(
      this.product.id,
      this.product.name,
      variant.label,
      variant.price,
      1
    );
  }

  onViewItem(): void {
    const variant = this.selectedVariant ?? this.product.variants[0];
    this.analytics.trackViewItem(this.product.id, this.product.name, variant.price);
  }
}
