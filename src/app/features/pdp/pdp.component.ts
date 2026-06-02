import {
  Component,
  Input,
  signal,
  computed,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { ProductMockService, Product, ProductVariant } from '../../core/services/product-mock.service';
import { CartService } from '../../core/services/cart.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductGalleryComponent } from '../../shared/components/product-gallery/product-gallery.component';
import { AccordionItemComponent } from '../../shared/components/accordion-item/accordion-item.component';

@Component({
  selector: 'app-pdp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    ProductCardComponent,
    ProductGalleryComponent,
    AccordionItemComponent,
  ],
  template: `
    @if (product()) {
      <main class="pdp" [attr.aria-labelledby]="'pdp-title-' + product()!.id"
            itemscope itemtype="https://schema.org/Product">

        <!-- ════════════════════════════════════════════════════════════
             BREADCRUMB
        ════════════════════════════════════════════════════════════ -->
        <nav class="pdp__breadcrumb" aria-label="Breadcrumb">
          <div class="container">
            <ol class="pdp__breadcrumb-list"
                itemscope itemtype="https://schema.org/BreadcrumbList">
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a routerLink="/" itemprop="item" class="pdp__breadcrumb-link">
                  <span itemprop="name">Inicio</span>
                </a>
                <meta itemprop="position" content="1" />
              </li>
              <span class="pdp__breadcrumb-sep" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="#354159" stroke-width="1.2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                <a routerLink="/productos" itemprop="item" class="pdp__breadcrumb-link">
                  <span itemprop="name">Farmacia</span>
                </a>
                <meta itemprop="position" content="2" />
              </li>
              <span class="pdp__breadcrumb-sep" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="#354159" stroke-width="1.2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <li aria-current="page" itemprop="itemListElement" itemscope
                  itemtype="https://schema.org/ListItem">
                <span itemprop="name" class="pdp__breadcrumb-current">
                  {{ product()!.category }}
                </span>
                <meta itemprop="position" content="3" />
              </li>
            </ol>
          </div>
        </nav>

        <!-- ════════════════════════════════════════════════════════════
             SECCIÓN PRINCIPAL: Galería + Info
        ════════════════════════════════════════════════════════════ -->
        <section class="container pdp__section-main" aria-label="Información del producto">
          <div class="pdp__card">

            <!-- ── Galería de Producto ───────────────────────────────── -->
            <div class="pdp__gallery-col">
              <app-product-gallery
                [images]="product()!.images"
                [productName]="product()!.name"
                [productId]="product()!.id"
              />
            </div>

            <!-- ── Panel de Información ──────────────────────────────── -->
            <div class="pdp__info-col">

              <!-- SKU + "SOBRE TU UN" -->
              <div class="pdp__meta-row">
                <span class="pdp__label-sobre">SOBRE TU UN</span>
                <span class="pdp__sku">SKU {{ product()!.variants[0]?.sku ?? '123456' }}</span>
              </div>

              <!-- Título del Producto (H1 — único en la página, crítico SEO) -->
              <h1 class="pdp__name" [id]="'pdp-title-' + product()!.id" itemprop="name">
                {{ product()!.name }}
              </h1>

              <!-- ── Bloque de Precios ───────────────────────────────── -->
              <div class="pdp__prices" aria-live="polite" aria-atomic="true"
                   itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                <meta itemprop="priceCurrency" content="PEN" />
                <meta itemprop="availability" content="https://schema.org/InStock" />
                <meta itemprop="price" [attr.content]="selectedVariant()?.price" />

                <!-- Fila 1: Precio Regular -->
                <div class="pdp__price-row">
                  <span class="pdp__price-label">Precio regular</span>
                  <div class="pdp__price-right">
                    @if (selectedVariant()?.originalPrice) {
                      <span class="pdp__price-old">
                        {{ selectedVariant()!.originalPrice | currency:'':'':'1.2-2' }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Fila 2: Precio Promocional -->
                <div class="pdp__price-row">
                  <span class="pdp__price-label">Precio promocional</span>
                  <div class="pdp__price-right">
                    <span class="pdp__price-current">
                      {{ selectedVariant()?.price | currency:'':'':'1.2-2' }}
                    </span>
                    <span class="pdp__price-tag pdp__price-tag--dark">
                      {{ getDiscount(selectedVariant()!) }}%
                    </span>
                  </div>
                </div>

                <!-- Fila 3: Exclusivo con tarjeta -->
                <div class="pdp__price-row">
                  <span class="pdp__price-label">Exclusivo con tarjeta</span>
                  <div class="pdp__price-right">
                    <!-- Íconos de tarjetas de crédito -->
                    <span class="pdp__card-icons" aria-label="Agora Pay y tarjetas bancarias">
                      <span class="pdp__card-icon pdp__card-icon--black" aria-hidden="true">
                        <svg width="40" height="20" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="30" rx="8" fill="#000000"/>
                          <text x="10" y="22" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="21" fill="#ffffff" letter-spacing="-0.5">sıp</text>
                          <circle cx="47" cy="10" r="4.5" fill="#00B1FF"/>
                        </svg>
                      </span>
                      <span class="pdp__card-icon pdp__card-icon--blue" aria-hidden="true">
                        <svg width="40" height="20" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="30" rx="8" fill="#00B1FF"/>
                          <text x="10" y="22" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="21" fill="#ffffff" letter-spacing="-0.5">sıp</text>
                          <circle cx="47" cy="10" r="4.5" fill="#000000"/>
                        </svg>
                      </span>
                    </span>
                    <span class="pdp__price-card-value">
                      {{ (selectedVariant()?.price ?? 0) * 0.95 | currency:'':'':'1.2-2' }}
                    </span>
                    <span class="pdp__price-tag pdp__price-tag--blue">
                      5%
                    </span>
                  </div>
                </div>
              </div>

              <!-- ── Descripción corta ───────────────────────────────── -->
              <div class="pdp__description-short">
                <div class="pdp__description-text" [class.pdp__description-text--collapsed]="!descriptionExpanded()">
                  <ul class="pdp__bullet-list">
                    @for (bullet of descriptionBullets(); track bullet) {
                      <li>{{ bullet }}</li>
                    }
                  </ul>
                </div>
                @if (product()!.description.length > 120) {
                  <button
                    class="pdp__ver-mas"
                    (click)="descriptionExpanded.set(!descriptionExpanded())"
                    [attr.aria-expanded]="descriptionExpanded()"
                  >
                    {{ descriptionExpanded() ? 'Ver menos' : 'Ver más' }}
                  </button>
                }
              </div>

              <!-- ── Selector de Variantes ───────────────────────────── -->
              <div class="pdp__variants" role="group" aria-labelledby="variant-label-id">
                <p id="variant-label-id" class="pdp__variants-title">
                  Presentación: <strong>{{ selectedVariant()?.label?.split(' ')?.[0] ?? '' }}</strong>
                </p>

                <div class="pdp__variant-list">
                  @for (variant of product()!.variants; track variant.id; let first = $first; let last = $last; let i = $index) {
                    <label
                      class="pdp__variant-option"
                      [class.pdp__variant-option--selected]="selectedVariant()?.id === variant.id"
                      [class.pdp__variant-option--first]="first"
                      [class.pdp__variant-option--last]="last"
                      [attr.for]="'variant-radio-' + variant.id"
                    >
                      <!-- Miniatura de la variante -->
                      <div class="pdp__variant-thumb">
                        <img
                          [src]="product()!.images[i] || product()!.images[0]"
                          [alt]="variant.label"
                          width="48"
                          height="48"
                          loading="lazy"
                        />
                      </div>

                      <!-- Texto de variante -->
                      <div class="pdp__variant-text">
                        <span class="pdp__variant-name">{{ variant.label }}</span>
                        <span class="pdp__variant-price">
                          desde
                          <strong>S/ {{ variant.price | number:'1.2-2' }}</strong>
                        </span>
                      </div>

                      <!-- Radio button estilizado -->
                      <div class="pdp__radio" [class.pdp__radio--checked]="selectedVariant()?.id === variant.id">
                        <input
                          type="radio"
                          name="variant"
                          [id]="'variant-radio-' + variant.id"
                          [value]="variant.id"
                          [checked]="selectedVariant()?.id === variant.id"
                          (change)="selectVariant(variant)"
                          class="pdp__radio-input"
                          [attr.aria-label]="variant.label + ' — S/ ' + variant.price"
                        />
                        <span class="pdp__radio-circle"></span>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- ── Botones CTA ─────────────────────────────────────── -->
              <div class="pdp__cta-row">
                <button
                  class="pdp__btn-cart"
                  id="pdp-add-to-cart"
                  (click)="addToCart()"
                  [disabled]="cartStatus() === 'loading' || (selectedVariant()?.stock ?? 0) === 0"
                  [attr.aria-busy]="cartStatus() === 'loading'"
                  aria-label="Agregar al carrito"
                >
                  @if (cartStatus() === 'loading') {
                    <span class="pdp__spinner" aria-hidden="true"></span>
                    <span>Agregando...</span>
                  } @else {
                    <span>Agregar al carrito</span>
                  }
                </button>

                <!-- Botón de Favorito -->
                <button
                  class="pdp__btn-fav"
                  [class.pdp__btn-fav--active]="isFavorite()"
                  (click)="toggleFavorite()"
                  [attr.aria-label]="isFavorite() ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                  [attr.aria-pressed]="isFavorite()"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                       [attr.fill]="isFavorite() ? '#17A15B' : 'none'"
                       stroke="#17A15B" stroke-width="1.8" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>

              <!-- Error Toast -->
              @if (cartError()) {
                <div class="pdp__error" role="alert">
                  <span>{{ cartError() }}</span>
                  <button (click)="cartService.clearError()" aria-label="Cerrar">✕</button>
                </div>
              }

            </div><!-- /pdp__info-col -->
          </div><!-- /pdp__card -->
        </section>

        <!-- ════════════════════════════════════════════════════════════
             ACORDEONES DE INFORMACIÓN DEL PRODUCTO
             Separados de la card principal — diseño Inkafarma
        ════════════════════════════════════════════════════════════ -->
        <section class="container pdp__accordions-section" aria-label="Detalles del producto">

          <!-- Acordeón 1: Descripción larga (abierto por defecto) -->
          <app-accordion-item
            itemId="descripcion-larga"
            title="Descripción larga"
            [defaultOpen]="true"
          >
            <p class="pdp__accordion-text">
              Este producto es distribuido por Inamed Pharma S.A. (O.m 10213).
            </p>
            <p class="pdp__accordion-text">
              {{ product()!.description }}
            </p>
          </app-accordion-item>

          <!-- Acordeón 2: Composición (cerrado) -->
          <app-accordion-item
            itemId="composicion"
            title="Composición"
            [defaultOpen]="false"
          >
            <p class="pdp__accordion-text">
              Paracetamol 500mg + Clorfenamina 5mg + Fenilefrina 2mg por tableta recubierta.
              Excipientes: almidón de maíz, celulosa microcristalina, dióxido de silicio
              coloidal, estearato de magnesio, talco, hidroxipropil metilcelulosa,
              propilenglicol, dióxido de titanio.
            </p>
          </app-accordion-item>

          <!-- Acordeón 3: Contraindicaciones (cerrado) -->
          <app-accordion-item
            itemId="contraindicaciones"
            title="Contraindicaciones"
            [defaultOpen]="false"
          >
            <ul class="pdp__accordion-list">
              <li>Hipersensibilidad a cualquiera de los componentes de la fórmula.</li>
              <li>Hipertensión arterial severa no controlada.</li>
              <li>Pacientes con antecedentes de úlcera péptica activa.</li>
              <li>Embarazo y lactancia (consulte a su médico).</li>
              <li>No administrar en niños menores de 6 años sin indicación médica.</li>
              <li>No exceder la dosis recomendada. Mantener fuera del alcance de los niños.</li>
            </ul>
          </app-accordion-item>

        </section>

        <!-- ════════════════════════════════════════════════════════════
             CROSS-SELLING — "Lo más buscado"
             @defer (on viewport; prefetch on idle):
             - El carrusel NO se carga hasta que el usuario hace scroll
             - prefetch on idle: pre-descarga el chunk en background
             - Elimina el carrusel del critical rendering path → mejor LCP
        ════════════════════════════════════════════════════════════ -->
        @defer (on viewport; prefetch on idle) {
          <section class="container pdp__cross-selling" aria-labelledby="cross-selling-title">

            <div class="pdp__cross-selling-header">
              <div class="pdp__cross-selling-title-group">
                <h2 id="cross-selling-title" class="pdp__cross-selling-title">
                  Lo más buscado
                </h2>
                <a routerLink="/productos" class="pdp__cross-selling-link">
                  Mostrar más
                </a>
              </div>

              <!-- Nav arrows -->
              <div class="pdp__carousel-nav" aria-hidden="true">
                <button 
                  class="pdp__carousel-arrow pdp__carousel-arrow--prev" 
                  aria-label="Anterior"
                  (click)="scrollCarousel(-1)"
                  [disabled]="crossSelling().length <= 4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button 
                  class="pdp__carousel-arrow pdp__carousel-arrow--next" 
                  aria-label="Siguiente"
                  (click)="scrollCarousel(1)"
                  [disabled]="crossSelling().length <= 4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Carrusel horizontal con scroll snap -->
            <div #carousel class="pdp__carousel" role="list" aria-label="Productos más buscados">
              @for (related of crossSelling(); track related.id) {
                <div class="pdp__carousel-item" role="listitem">
                  <app-product-card
                    [product]="related"
                    [selectedVariant]="related.variants[0]"
                    (addToCart)="onCrossSellingAdd($event)"
                  />
                </div>
              }
            </div>

          </section>
        } @placeholder {
          <!-- Skeleton mientras el viewport no ha llegado al carrusel -->
          <div class="container pdp__cross-selling" aria-hidden="true">
            <div class="pdp__cross-selling-header">
              <div class="skeleton" style="height:24px; width:160px; border-radius:6px;"></div>
              <div class="skeleton" style="height:18px; width:80px; border-radius:6px;"></div>
            </div>
            <div class="pdp__carousel">
              @for (i of [1,2,3,4]; track i) {
                <div class="pdp__carousel-item">
                  <div class="skeleton" style="height:380px; border-radius:12px;"></div>
                </div>
              }
            </div>
          </div>
        } @loading {
          <p class="sr-only" aria-live="polite">Cargando productos relacionados...</p>
        }

      </main>
    } @else {
      <!-- Skeleton de carga global -->
      <div class="pdp__loading container" aria-busy="true" aria-label="Cargando producto">
        <div class="pdp__loading-card">
          <div class="pdp__loading-gallery">
            <div class="pdp__loading-thumbs">
              @for (i of [1,2,3]; track i) {
                <div class="skeleton" style="width:88px; height:88px; border-radius:12px;"></div>
              }
            </div>
            <div class="skeleton" style="flex:1; height:500px; border-radius:16px;"></div>
          </div>
          <div class="pdp__loading-info">
            <div class="skeleton" style="height:16px; width:60%; border-radius:4px;"></div>
            <div class="skeleton" style="height:52px; width:100%; border-radius:8px; margin-top:12px;"></div>
            <div class="skeleton" style="height:80px; width:100%; border-radius:8px; margin-top:16px;"></div>
            <div class="skeleton" style="height:160px; width:100%; border-radius:12px; margin-top:16px;"></div>
            <div class="skeleton" style="height:48px; width:100%; border-radius:200px; margin-top:24px;"></div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './pdp.component.scss',
})
export class PdpComponent implements OnInit {
  /**
   * withComponentInputBinding() en app.config.ts convierte el route param :id
   * automáticamente en este @Input(), eliminando la necesidad de ActivatedRoute.
   */
  @Input() id!: string;

  private productService = inject(ProductMockService);
  cartService             = inject(CartService);
  private analytics       = inject(AnalyticsService);
  private titleService    = inject(Title);
  private metaService     = inject(Meta);

  @ViewChild('carousel') carouselRef?: ElementRef<HTMLElement>;

  // ─── Signals de estado ─────────────────────────────────────────────
  readonly product        = signal<Product | null>(null);
  readonly crossSelling   = signal<Product[]>([]);
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly descriptionExpanded = signal(false);
  readonly isFavorite     = signal(false);

  // Estados del carrito (derivados del CartService)
  readonly cartStatus  = this.cartService.status;
  readonly cartError   = this.cartService.errorMessage;

  /**
   * Convierte la descripción en viñetas al separar por punto o por
   * "¿", simulando el formato de bullets que muestra el diseño.
   */
  readonly descriptionBullets = computed<string[]>(() => {
    const desc = this.product()?.description ?? '';
    // Separa en hasta 3 bullets para la preview colapsada
    const parts = desc.split(/[.?!]/).filter(s => s.trim().length > 15).slice(0, 4);
    return parts.map(s => s.trim() + '.');
  });

  ngOnInit(): void {
    this.productService.getById(this.id).subscribe((product) => {
      if (!product) return;

      this.product.set(product);
      this.selectedVariant.set(product.variants[0]);

      // ── SEO Dinámico (se ejecuta en el servidor con SSR) ──────────────
      const price = product.variants[0]?.price ?? 0;
      this.titleService.setTitle(`${product.name} — Comprar online | Inkafarma`);
      this.metaService.updateTag({
        name: 'description',
        content: `${product.description.slice(0, 150)}. Precio: S/ ${price}. Envío rápido.`,
      });
      this.metaService.updateTag({ property: 'og:title',   content: product.name });
      this.metaService.updateTag({ property: 'og:image',   content: product.imageUrl });
      this.metaService.updateTag({ property: 'og:type',    content: 'product' });

      // ── Analytics ─────────────────────────────────────────────────────
      this.analytics.trackViewItem(product.id, product.name, price);

      // ── Cross-selling ─────────────────────────────────────────────────
      const crossIds = product.crossSelling || [];
      this.productService.getCrossSelling(crossIds, product.id).subscribe((related) => {
        this.crossSelling.set(related);
      });
    });
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
  }

  addToCart(): void {
    const p = this.product();
    const v = this.selectedVariant();
    if (!p || !v) return;
    this.cartService.addItem(p, v, 1);
    this.analytics.trackAddToCart(p.id, p.name, v.label, v.price, 1);
  }

  onCrossSellingAdd(event: { product: Product; variant: ProductVariant }): void {
    this.cartService.addItem(event.product, event.variant, 1);
  }

  toggleFavorite(): void {
    this.isFavorite.set(!this.isFavorite());
  }

  getDiscount(variant: ProductVariant | null): number {
    if (!variant?.originalPrice) return 0;
    return Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100);
  }

  scrollCarousel(direction: number): void {
    if (!this.carouselRef) return;
    const carousel = this.carouselRef.nativeElement;
    const scrollAmount = carousel.clientWidth * 0.8;
    carousel.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
  }
}
