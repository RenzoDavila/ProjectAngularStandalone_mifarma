import {
  Component,
  Input,
  signal,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * ProductGalleryComponent — Standalone
 *
 * Galería de imágenes del producto con:
 * - Strip vertical de miniaturas (thumbnails 88×88px) con selección activa
 * - Vista principal con zoom-on-hover
 * - view-transition-name para el efecto "vuelo" PLP → PDP
 *
 * NOTA sobre LCP: la imagen principal usa fetchpriority="high" directamente
 * en el atributo HTML. En SSR, Angular Universal inyecta también el
 * <link rel="preload"> en el <head> gracias a TransferState.
 * NgOptimizedImage requiere un ImageLoader configurado para assets locales;
 * usamos <img> estándar con fetchpriority para el mismo efecto de LCP.
 */
@Component({
  selector: 'app-product-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery">

      <!-- ─── Strip vertical de miniaturas ─────────────────────────── -->
      <div class="gallery__thumbs" role="list" aria-label="Imágenes del producto">
        @for (img of images; track img; let i = $index) {
          <button
            class="gallery__thumb"
            [class.gallery__thumb--active]="activeImage() === img"
            (click)="setActive(img)"
            role="listitem"
            [attr.aria-label]="'Ver imagen ' + (i + 1)"
            [attr.aria-pressed]="activeImage() === img"
          >
            <img
              [src]="img"
              [alt]="'Vista ' + (i + 1) + ' de ' + productName"
              width="72"
              height="72"
              loading="lazy"
              class="gallery__thumb-img"
            />
          </button>
        }
      </div>

      <!-- ─── Imagen Principal ──────────────────────────────────────── -->
      <div class="gallery__main" aria-label="Imagen principal del producto">
        <div class="gallery__main-wrapper">
          <!--
            fetchpriority="high" → hint al browser para cargar antes que otros recursos.
            En SSR, Angular renderiza este atributo en el HTML del servidor, por lo que
            el browser puede iniciar la descarga antes de ejecutar JS.
            [style.view-transition-name] → empareja con la misma propiedad en ProductCard
            para activar el efecto "vuelo" nativo de la View Transitions API.
          -->
          <img
            [src]="activeImage()"
            [alt]="productName"
            width="520"
            height="520"
            fetchpriority="high"
            class="gallery__main-img product-image-transition"
            [style.view-transition-name]="'product-' + productId"
          />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .gallery {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 16px;
      width: 100%;
      height: 520px;
    }

    /* ─── Thumbnails ────────────────────────────────────────────────── */
    .gallery__thumbs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
      width: 91px;
    }

    .gallery__thumb {
      width: 88px;
      height: 88px;
      border-radius: 12px;
      border: 1px solid transparent;
      background: #fff;
      padding: 4px;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 200ms ease, box-shadow 200ms ease;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &--active {
        border-color: #1A8FF1;
        box-shadow: 0 0 0 2px rgba(26, 143, 241, 0.12);
      }

      &:hover:not(&--active) {
        border-color: #c8d6e8;
      }
    }

    .gallery__thumb-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }

    /* ─── Main Image ────────────────────────────────────────────────── */
    .gallery__main {
      flex: 1;
      min-width: 0;
      height: 100%;
    }

    .gallery__main-wrapper {
      width: 100%;
      height: 100%;
      background: #ffffff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;

      &:hover .gallery__main-img {
        transform: scale(1.04);
      }
    }

    .gallery__main-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
})
export class ProductGalleryComponent implements OnChanges {
  @Input({ required: true }) images: string[] = [];
  @Input({ required: true }) productName!: string;
  @Input({ required: true }) productId!: string;

  readonly activeImage = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && this.images.length) {
      this.activeImage.set(this.images[0]);
    }
  }

  setActive(img: string): void {
    this.activeImage.set(img);
  }
}
