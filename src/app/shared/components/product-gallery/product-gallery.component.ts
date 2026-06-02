import {
  Component,
  Input,
  signal,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * Standalone image gallery for the Product Detail Page.
 *
 * @description
 * Renders a vertical strip of thumbnail buttons and a zoomable main image.
 *
 * **LCP optimisation:**
 * The main image carries `fetchpriority="high"` so the browser prioritises
 * it during resource loading. In SSR mode Angular renders this attribute in the
 * server-generated HTML, allowing the browser to start fetching before JS runs.
 * Standard `<img>` is used instead of `NgOptimizedImage` because local SVG
 * assets are resolution-independent and gain nothing from generated `srcset`.
 *
 * **View Transitions:**
 * `[style.view-transition-name]` on the main image matches the same property on
 * `ProductCardComponent`, enabling the browser-native "flying image" morph when
 * navigating from the PLP to the PDP.
 *
 * **Accessibility (WCAG AA):**
 * - Thumbnails are wrapped in a `<ul>/<li>` structure — native list semantics
 *   without ARIA role overrides on non-list elements.
 * - Each thumbnail `<button>` carries `aria-pressed` to communicate selection
 *   state to assistive technologies.
 * - The main image region is labelled with `aria-label`.
 */
@Component({
  selector: 'app-product-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery">

      <!-- ─── Thumbnail strip ───────────────────────────────────────── -->
      <ul class="gallery__thumbs" aria-label="Imágenes del producto">
        @for (imageUrl of images; track imageUrl; let i = $index) {
          <li class="gallery__thumb-item">
            <button
              class="gallery__thumb"
              [class.gallery__thumb--active]="activeImage() === imageUrl"
              (click)="selectImage(imageUrl)"
              type="button"
              [attr.aria-label]="'Ver imagen ' + (i + 1) + ' de ' + images.length"
              [attr.aria-pressed]="activeImage() === imageUrl"
            >
              <img
                [src]="imageUrl"
                [alt]="'Vista ' + (i + 1) + ' de ' + productName"
                width="72"
                height="72"
                loading="lazy"
                class="gallery__thumb-img"
              />
            </button>
          </li>
        }
      </ul>

      <!-- ─── Main image ────────────────────────────────────────────── -->
      <div
        class="gallery__main"
        role="img"
        [attr.aria-label]="'Imagen principal de ' + productName"
      >
        <div class="gallery__main-wrapper">
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

    /* Reset native <ul> styles — list semantics are preserved for AT */
    .gallery__thumbs {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
      width: 91px;
    }

    .gallery__thumb-item {
      width: 88px;
      height: 88px;
      flex-shrink: 0;
    }

    .gallery__thumb {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      border: 1px solid transparent;
      background: #fff;
      padding: 4px;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 200ms ease, box-shadow 200ms ease;
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

      /* WCAG 2.4.7: visible keyboard focus ring */
      &:focus-visible {
        outline: 2px solid #1A8FF1;
        outline-offset: 2px;
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
  /**
   * Ordered list of image URLs to display.
   * The first URL becomes the initially selected main image.
   */
  @Input({ required: true }) images: ReadonlyArray<string> = [];

  /** Accessible name used in `alt` attributes and `aria-label` values. */
  @Input({ required: true }) productName!: string;

  /**
   * Unique product identifier.
   * Used to set `view-transition-name` for the browser-native morph animation.
   */
  @Input({ required: true }) productId!: string;

  /** Signal holding the URL of the currently displayed main image. */
  readonly activeImage = signal<string>('');

  /**
   * Resets `activeImage` to the first image whenever the `images` input changes.
   * This handles product navigation without component destruction/recreation.
   *
   * @param changes - Angular's change record for all `@Input()` properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && this.images.length) {
      this.activeImage.set(this.images[0]);
    }
  }

  /**
   * Sets the provided image URL as the active main image.
   *
   * @param imageUrl - URL of the thumbnail the user clicked.
   */
  selectImage(imageUrl: string): void {
    this.activeImage.set(imageUrl);
  }
}
