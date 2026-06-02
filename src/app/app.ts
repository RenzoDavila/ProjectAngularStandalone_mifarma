import { Component, inject, ChangeDetectionStrategy, signal, effect, untracked } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { CartModalComponent } from './shared/components/cart-modal/cart-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartModalComponent],
  template: `
    <!-- ══════════════════════════════════════════════════════════════════
         HEADER GLOBAL — Fiel al diseño Inkafarma del Figma
    ══════════════════════════════════════════════════════════════════ -->
    <header class="site-header" role="banner">

      <!-- 1. Cintillo promocional (TopBarCintillo) -->
      <div class="site-header__cintillo">
        <span class="site-header__cintillo-text">
          Más salud a mejor precio
        </span>
      </div>

      <!-- 2. Barra principal: Logo + Buscador + Carrito -->
      <div class="site-header__main">
        <div class="site-header__container">

          <!-- Logo Inkafarma -->
          <a routerLink="/productos" class="site-header__logo" aria-label="Inkafarma — Ir al inicio">
            <img
              src="assets/logos/logo-nombre-inkafarma.png"
              alt="Inkafarma Logo"
              class="site-header__logo-img"
              width="184"
              height="48"
            />
          </a>

          <!-- Buscador (FormSearchNavbar) -->
          <div class="site-header__search-wrapper">
            <form class="site-header__search" role="search" action="/productos">
              <label for="header-search" class="sr-only">Busca una marca o producto</label>
              <input
                id="header-search"
                type="search"
                name="q"
                class="site-header__search-input"
                placeholder="Busca una marca o producto"
                autocomplete="off"
              />
              <button type="submit" class="site-header__search-btn" aria-label="Buscar">
                <!-- Lupa icon -->
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" stroke="#fff" stroke-width="1.5"/>
                  <path d="M11 11L14 14" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </form>
          </div>

          <!-- Acciones del header: Carrito -->
          <nav class="site-header__actions" aria-label="Acciones del usuario">
            <button
              (click)="openCartModal()"
              class="site-header__cart-btn"
              [class.site-header__cart-btn--animating]="cartAnimation()"
              [attr.aria-label]="'Carrito — ' + cartService.totalItems() + ' artículos'"
              type="button"
            >
              @if (cartAnimation()) {
                <span class="site-header__cart-plus">+1</span>
              } @else {
                <!-- Ícono carrito (Shared/HeaderButtonCart) -->
                <span class="site-header__cart-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2.5 2.5H4.167L5.833 12.5h8.334l1.666-7.5H5" stroke="#1A8FF1"
                          stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="7.5" cy="15" r="1" fill="#1A8FF1"/>
                    <circle cx="13.5" cy="15" r="1" fill="#1A8FF1"/>
                  </svg>
                </span>
                <span class="site-header__cart-count" aria-hidden="true">
                  {{ cartService.totalItems() }}
                </span>
              }
            </button>
          </nav>

        </div><!-- /container -->
      </div><!-- /main -->

      <!-- 3. Navbar de categorías (content-categories) -->
      <nav class="site-header__nav" aria-label="Categorías">
        <div class="site-header__container site-header__nav-inner">
          @for (cat of navCategories; track cat.label) {
            <a
              [routerLink]="cat.route"
              routerLinkActive="site-header__nav-link--active"
              class="site-header__nav-link"
            >
              {{ cat.label }}
            </a>
          }
        </div>
      </nav>

    </header>

    <!-- ══════════════════════════════════════════════════════════════════
         ROUTER OUTLET — Contenido de la página actual
    ══════════════════════════════════════════════════════════════════ -->
    <router-outlet />

    <!-- ══════════════════════════════════════════════════════════════════
         FOOTER
    ══════════════════════════════════════════════════════════════════ -->
    <footer class="site-footer" role="contentinfo">
      <div class="site-footer__container">

        <!-- Logo Footer
        <div class="site-footer__logo-section">
          <img
            src="assets/logos/logo-fondo-amarillo.png"
            alt="Inkafarma Logo"
            class="site-footer__logo"
            width="100"
            height="100"
          />
        </div>
        -->

        <!-- Columnas de links -->
        <div class="site-footer__cols">
          @for (col of footerCols; track $index) {
            <div class="site-footer__col">
              <p class="site-footer__col-title">{{ col.title }}</p>
              @for (link of col.links; track $index) {
                <p class="site-footer__col-link">{{ link }}</p>
              }
            </div>
          }

          <!-- Columna derecha: Síguenos + App -->
          <div class="site-footer__col">
            <p class="site-footer__col-title">Síguenos en</p>
            <div class="site-footer__social">
              <a href="#" aria-label="Instagram" class="site-footer__social-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="#fff" stroke-width="1.5"/>
                  <circle cx="12" cy="12" r="4" stroke="#fff" stroke-width="1.5"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#fff"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" class="site-footer__social-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                        stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>

            <p class="site-footer__col-title" style="margin-top: 24px">Libro de reclamaciones</p>
            <a href="#" class="site-footer__libro" aria-label="Libro de reclamaciones">
              <img
                src="assets/ui/libro-de-reclamaciones.jpg"
                alt="Libro de reclamaciones"
                class="site-footer__libro-img"
                width="64"
                height="72"
              />
            </a>

            <p class="site-footer__col-title" style="margin-top: 24px">Descarga nuestra app en</p>
            <div class="site-footer__apps">
              <a href="#" class="site-footer__app-btn" aria-label="Google Play">
                <img
                  src="assets/ui/ikafarma-google_play.png"
                  alt="Google Play"
                  class="site-footer__app-img"
                />
              </a>
              <a href="#" class="site-footer__app-btn" aria-label="App Store">
                <img
                  src="assets/ui/ikafarma-app_store.png"
                  alt="App Store"
                  class="site-footer__app-img"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

        <!-- Copyright -->
        <div class="site-footer__bottom">
          <p>Copyright © Inkafarma 2026 Todos los derechos reservados</p>
        </div>
    </footer>

    <!-- Cart Modal -->
    @if (isCartModalOpen()) {
      <app-cart-modal (closeRequest)="closeCartModal()"></app-cart-modal>
    }
  `,
  styles: [`
    /* ════════════════════════════════════════════════════════════════════
       HEADER STYLES — Inkafarma Design System
    ════════════════════════════════════════════════════════════════════ */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 200;
      background: #ffffff;
      filter: drop-shadow(0px 16px 20px rgba(53, 65, 89, 0.04));
    }

    .site-header__container {
      max-width: 1366px;
      margin-inline: auto;
      padding-inline: 24px;
    }

    /* ── 1. Cintillo ─────────────────────────────────────────────────── */
    .site-header__cintillo {
      background: linear-gradient(90deg, #17A15B 0%, #1A8FF1 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 6px 24px;
      height: 32px;
    }

    .site-header__cintillo-text {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 13px;
      line-height: 20px;
      letter-spacing: 0.1px;
      color: #ffffff;
      text-align: center;
    }

    /* ── 2. Barra principal ──────────────────────────────────────────── */
    .site-header__main {
      background: #ffffff;
      height: 64px;
      display: flex;
      align-items: center;
    }

    .site-header__main .site-header__container {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 100%;
      width: 100%;
    }

    /* Logo */
    .site-header__logo {
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      flex-shrink: 0;
      width: 184px;
    }

    .site-header__logo-img {
      height: auto;
      object-fit: contain;
    }

    .site-header__logo-mark {
      display: flex;
      align-items: center;
    }

    .site-header__logo-text {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #1B8F43;
      letter-spacing: -0.03em;
    }

    /* Buscador */
    .site-header__search-wrapper {
      flex: 1;
      max-width: 480px;
    }

    .site-header__search {
      display: flex;
      align-items: center;
      padding: 4px 4px 4px 16px;
      gap: 8px;
      height: 48px;
      background: #F8F8F8;
      border-radius: 200px;
      border: none;
    }

    .site-header__search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 21px;
      letter-spacing: 0.1px;
      color: #354159;

      &::placeholder { color: #7E8BA7; }
      &::-webkit-search-cancel-button { display: none; }
    }

    .site-header__search-btn {
      width: 40px;
      height: 40px;
      background: #17A15B;
      border: none;
      border-radius: 200px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 150ms ease;

      &:hover { background: #138f50; }
    }

    /* Acciones */
    .site-header__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .site-header__cart-btn {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 0 12px;
      gap: 4px;
      width: 68px;
      height: 40px;
      background: #EAF7FE;
      border-radius: 10px;
      border: none;
      text-decoration: none;
      cursor: pointer;
      transition: transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), background 300ms ease;
      font-family: inherit;

      &:hover { background: #d4effd; }
    }

    .site-header__cart-btn--animating {
      transform: scale(1.15) rotate(5deg);
      background: #d4effd;
    }

    .site-header__cart-plus {
      font-weight: 800;
      color: #1A8FF1;
      font-size: 16px;
      animation: popIn 300ms ease forwards;
    }

    @keyframes popIn {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .site-header__cart-icon {
      display: flex;
      align-items: center;
    }

    .site-header__cart-count {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 14px;
      line-height: 21px;
      letter-spacing: 0.1px;
      color: #1A8FF1;
    }

    /* ── 3. Nav de Categorías ────────────────────────────────────────── */
    .site-header__nav {
      background: #ffffff;
      border-top: 1px solid #F0F2F6;
      height: 48px;
    }

    .site-header__nav-inner {
      display: flex;
      align-items: flex-start;
      height: 100%;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar { display: none; }
    }

    .site-header__nav-link {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 0 16px;
      height: 100%;
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 13px;
      line-height: 20px;
      letter-spacing: 0.1px;
      color: #354159;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      border-bottom: 2px solid transparent;
      transition: color 150ms ease, border-color 150ms ease, background 150ms ease;

      &:hover { color: #1B8F43; }

      &--active {
        color: #ffffff;
        font-weight: 600;
        background: #1B8F43;
        border-bottom-color: transparent;
      }
    }

    /* ════════════════════════════════════════════════════════════════════
       FOOTER STYLES
    ════════════════════════════════════════════════════════════════════ */
    .site-footer {
      background: #FFF;
      color: #354159;
      padding: 40px 0 0;
      margin-top: 0;
    }

    .site-footer__container {
      max-width: 1366px;
      margin-inline: auto;
      padding-inline: 24px;
    }

    .site-footer__logo-section {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px 0 40px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .site-footer__logo {
      height: auto;
      object-fit: contain;
      max-width: 120px;
    }

    .site-footer__cols {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      padding-bottom: 40px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .site-footer__col-title {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 13px;
      line-height: 20px;
      color: #354159;
      margin: 0 0 12px;
      letter-spacing: 0.1px;
    }

    .site-footer__col-link {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 13px;
      line-height: 20px;
      color: #354159;
      margin: 0 0 8px;
      letter-spacing: 0.1px;
      cursor: pointer;
      transition: color 150ms ease;

      &:hover { color: #44516d; }
    }

    .site-footer__social {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }

    .site-footer__social-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 25%;
      background: #17a15b;
      border: 1px solid rgba(255,255,255,0.2);
      transition: border-color 150ms ease, background 150ms ease;

      &:hover { background: rgba(255,255,255,0.1); border-color: #17a15b; background: #138f50; }
    }

    .site-footer__libro {
      display: inline-block;
      margin-top: 8px;
      text-decoration: none;
      border-radius: 25%;
      overflow: hidden;
      transition: transform 150ms ease, filter 150ms ease;

      &:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
    }

    .site-footer__libro-img {
      display: block;
      width: 64px;
      height: auto;
      border-radius: 25%;
      object-fit: cover;
    }

    .site-footer__apps {
      margin-top: 12px;
    }

    .site-footer__app-btn {
      display: inline-block;
      max-width: 50%;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      transition: transform 150ms ease, filter 150ms ease;
      cursor: pointer;

      &:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
    }

    .site-footer__app-img {
      display: block;
      width: 100%;
      height: auto;
      max-width: 200px;
      object-fit: contain;
    }

    .site-footer__bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      background: #f8f8f8;
      padding: 20px 0;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #354159;
    }
  `],
})
export class App {
  readonly cartService = inject(CartService);
  readonly isCartModalOpen = signal(false);
  
  cartAnimation = signal(false);
  private initialCartLoad = true;

  constructor() {
    effect(() => {
      const count = this.cartService.totalItems();
      untracked(() => {
        if (this.initialCartLoad) {
          this.initialCartLoad = false;
          return;
        }
        if (count > 0) {
          this.cartAnimation.set(true);
          setTimeout(() => this.cartAnimation.set(false), 800);
        }
      });
    });
  }

  openCartModal(): void {
    this.isCartModalOpen.set(true);
  }

  closeCartModal(): void {
    this.isCartModalOpen.set(false);
  }

  readonly navCategories = [
    { label: 'Dermocosmetica', route: '/dermocosmetica' },
    { label: 'Farmacia',       route: '/productos' },
    { label: 'Bienestar',      route: '/bienestar' },
    { label: 'Infantil',       route: '/infantil' },
    { label: 'Fotoprotección', route: '/fotoproteccion' },
    { label: 'Inkaclub',       route: '/inkaclub' },
    { label: 'Tienda 24 hrs.', route: '/tienda24hrs' },
    { label: 'Catálogos',      route: '/catalogos' },
  ];

  readonly footerCols = [
    {
      title: 'Sobre Inkafarma',
      links: [
        'Quiénes somos',
        'Trabaja con nosotros',
        'Nuestras tiendas',
        'Política de privacidad',
        'Términos y condiciones',
        'Preguntas frecuentes',
      ],
    },
    {
      title: 'Mis compras',
      links: [
        'Mi cuenta',
        'Mis pedidos',
        'Seguimiento de pedido',
        'Devoluciones y cambios',
        'Métodos de pago',
        'Envíos a domicilio',
      ],
    },
    {
      title: 'Categorías',
      links: [
        'Farmacia',
        'Dermocosmética',
        'Bienestar',
        'Infantil',
        'Fotoprotección',
        'Vitaminas y suplementos',
      ],
    },
  ];
}
