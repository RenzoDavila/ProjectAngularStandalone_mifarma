import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

import { ProductMockService, Product, ProductVariant } from '../../core/services/product-mock.service';
import { CartService } from '../../core/services/cart.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-plp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ProductCardComponent],
  template: `
    <main class="plp">

      <!-- ─── HEADER PLP ─────────────────────────────────────────────── -->
      <header class="plp__hero">
        <div class="container">
          <h1 class="plp__title">Farmacia Online</h1>
          <p class="plp__subtitle">
            Medicamentos y productos de salud al mejor precio, con despacho a domicilio.
          </p>

          <!-- Buscador Semántico -->
          <div class="plp__search-wrapper" role="search">
            <label for="search-input" class="sr-only">Buscar productos o síntomas</label>
            <div class="plp__search-box">
              <svg class="plp__search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="search-input"
                type="search"
                class="plp__search-input"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch($event)"
                placeholder="Busca por nombre o síntoma (ej: &quot;me duele la cabeza&quot;)"
                autocomplete="off"
                aria-label="Buscar productos"
                aria-controls="product-grid"
              />
              @if (searchQuery().length > 0) {
                <button
                  class="plp__search-clear"
                  (click)="clearSearch()"
                  aria-label="Limpiar búsqueda"
                >✕</button>
              }
            </div>

            @if (searchQuery().length > 0) {
              <p class="plp__search-hint" role="status" aria-live="polite">
                @if (isSemanticResult()) {
                  <span class="plp__search-badge">🤖 Búsqueda inteligente</span>
                }
                {{ filteredProducts().length }} resultado(s) para
                "<strong>{{ searchQuery() }}</strong>"
              </p>
            }
          </div>
        </div>
      </header>

      <!-- ─── FILTROS / CATEGORÍAS ───────────────────────────────────── -->
      <nav class="plp__categories container" aria-label="Filtrar por categoría">
        <div class="plp__category-list" role="list">
          <button
            class="plp__category-btn"
            [class.plp__category-btn--active]="activeCategory() === null"
            (click)="filterByCategory(null)"
            role="listitem"
            id="category-all"
          >
            Todos
          </button>
          @for (cat of categories(); track cat) {
            <button
              class="plp__category-btn"
              [class.plp__category-btn--active]="activeCategory() === cat"
              (click)="filterByCategory(cat)"
              role="listitem"
              [id]="'category-' + cat.replace(' ', '-').toLowerCase()"
            >
              {{ cat }}
            </button>
          }
        </div>
      </nav>

      <!-- ─── GRILLA DE PRODUCTOS ──────────────────────────────────────
           aria-live: cuando los filtros cambian, el lector de pantalla
           anuncia el nuevo número de resultados.
      ────────────────────────────────────────────────────────────────── -->
      <section
        class="plp__grid-section container"
        aria-labelledby="plp-results-count"
      >
        <p id="plp-results-count" class="plp__results-count" aria-live="polite">
          {{ filteredProducts().length }} producto(s) encontrado(s)
        </p>

        @if (loading()) {
          <!-- Skeleton Grid -->
          <div class="plp__grid" aria-label="Cargando productos" aria-busy="true" id="product-grid">
            @for (i of skeletons; track i) {
              <div class="product-card-skeleton" aria-hidden="true">
                <div class="skeleton" style="height: 200px;"></div>
                <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                  <div class="skeleton" style="height: 0.75rem; width: 40%;"></div>
                  <div class="skeleton" style="height: 1rem; width: 80%;"></div>
                  <div class="skeleton" style="height: 1rem; width: 60%;"></div>
                  <div class="skeleton" style="height: 2rem; margin-top: 0.5rem;"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filteredProducts().length === 0) {
          <div class="plp__empty" role="status" id="product-grid">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <p>No encontramos productos para "<strong>{{ searchQuery() }}</strong>"</p>
            <button class="btn btn--secondary" (click)="clearSearch()">Ver todos los productos</button>
          </div>
        } @else {
          <div class="plp__grid" id="product-grid" role="list" aria-label="Listado de productos">
            @for (product of filteredProducts(); track product.id) {
              <div role="listitem">
                <app-product-card
                  [product]="product"
                  [selectedVariant]="product.variants[0]"
                  (addToCart)="onAddToCart($event)"
                />
              </div>
            }
          </div>
        }
      </section>

    </main>
  `,
  styleUrl: './plp.component.scss',
})
export class PlpComponent implements OnInit {
  private productService = inject(ProductMockService);
  private cartService = inject(CartService);
  private analytics = inject(AnalyticsService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  // ─── Signals ─────────────────────────────────────────────────────────────
  private readonly _allProducts = signal<Product[]>([]);
  readonly loading = signal(true);

  searchQuery = signal('');
  activeCategory = signal<string | null>(null);
  isSemanticResult = signal(false);
  private _searchResults = signal<Product[]>([]);

  /** Computed: aplica filtro de categoría sobre los resultados de búsqueda */
  readonly filteredProducts = computed(() => {
    const cat = this.activeCategory();
    const search = this.searchQuery();

    const source = search.length > 0 ? this._searchResults() : this._allProducts();

    if (!cat) return source;
    return source.filter((p) => p.category === cat);
  });

  /** Computed: lista de categorías únicas del catálogo */
  readonly categories = computed(() =>
    [...new Set(this._allProducts().map((p) => p.category))]
  );

  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];

  ngOnInit(): void {
    this.titleService.setTitle('Farmacia Online | Mifarma — Compra medicamentos al mejor precio');
    this.metaService.updateTag({
      name: 'description',
      content: 'Compra medicamentos, vitaminas y productos de salud online. Envío a domicilio en Lima y provincias. Los mejores precios garantizados.',
    });

    this.productService.getAll().subscribe((products) => {
      this._allProducts.set(products);
      this.loading.set(false);

      // Analytics: view_item_list
      this.analytics.trackViewItemList(
        products.map((p) => ({ id: p.id, name: p.name, price: p.variants[0]?.price ?? 0 }))
      );
    });
  }

  onSearch(query: string): void {
    if (!query.trim()) {
      this._searchResults.set([]);
      this.isSemanticResult.set(false);
      return;
    }

    this.productService.search(query).subscribe((results) => {
      this._searchResults.set(results);
      // Detecta si fue una búsqueda semántica comparando con búsqueda léxica simple
      const lexical = this._allProducts().filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      this.isSemanticResult.set(
        results.length > 0 && lexical.length === 0
      );
      this.analytics.trackSearch(query, results.length);
    });
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this._searchResults.set([]);
    this.isSemanticResult.set(false);
    this.activeCategory.set(null);
  }

  filterByCategory(category: string | null): void {
    this.activeCategory.set(category);
  }

  onAddToCart(event: { product: Product; variant: ProductVariant }): void {
    this.cartService.addItem(event.product, event.variant, 1);
  }
}
