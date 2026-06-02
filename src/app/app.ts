import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- ══════════════════════════════════════════════════════════════════
         HEADER GLOBAL — Fiel al diseño Inkafarma del Figma
    ══════════════════════════════════════════════════════════════════ -->
    <header class="site-header" role="banner">

      <!-- 1. Cintillo promocional (TopBarCintillo) -->
      <div class="site-header__cintillo">
        <span class="site-header__cintillo-text">
          Es un hecho establecido hace demasiado tiempo que un lector.
        </span>
      </div>

      <!-- 2. Barra principal: Logo + Buscador + Carrito -->
      <div class="site-header__main">
        <div class="site-header__container">

          <!-- Logo Inkafarma -->
          <a routerLink="/productos" class="site-header__logo" aria-label="Inkafarma — Ir al inicio">
            <!-- Ícono circular verde + texto "inkafarma" en verde -->
            <span class="site-header__logo-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="11" fill="#1B8F43"/>
                <path d="M7 11.5L9.5 14L15 8.5" stroke="#FFF200" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="site-header__logo-text">inkafarma</span>
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
            <a
              routerLink="/productos"
              class="site-header__cart-btn"
              [attr.aria-label]="'Carrito — ' + cartService.totalItems() + ' artículos'"
            >
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
            </a>
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
            <div class="site-footer__libro" aria-label="Libro de reclamaciones">
              <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
                <rect x="4" y="4" width="40" height="44" rx="4" fill="none" stroke="#fff" stroke-width="2"/>
                <rect x="12" y="14" width="24" height="4" rx="2" fill="#fff" opacity="0.5"/>
                <rect x="12" y="22" width="16" height="4" rx="2" fill="#fff" opacity="0.3"/>
              </svg>
            </div>

            <p class="site-footer__col-title" style="margin-top: 24px">Descarga nuestra app en</p>
            <div class="site-footer__apps">
              <a href="#" class="site-footer__app-btn" aria-label="Google Play">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff" aria-hidden="true">
                  <path d="M2 1.5l12 6.5-12 6.5V1.5z"/>
                </svg>
                Google Play
              </a>
              <a href="#" class="site-footer__app-btn" aria-label="App Store">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff" aria-hidden="true">
                  <path d="M12.5 8c0-2.5-2-4.5-4.5-4.5S3.5 5.5 3.5 8s2 4.5 4.5 4.5S12.5 10.5 12.5 8z"/>
                </svg>
                App Store
              </a>
            </div>
          </div>
        </div>

        <!-- Copyright -->
        <div class="site-footer__bottom">
          <p>Copyright © Inkafarma 2026 Todos los derechos reservados</p>
        </div>

      </div>
    </footer>
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
      text-decoration: none;
      transition: background 150ms ease;

      &:hover { background: #d4effd; }
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
      transition: color 150ms ease, border-color 150ms ease;

      &:hover { color: #1B8F43; }

      &--active {
        color: #1B8F43;
        font-weight: 600;
        border-bottom-color: #1B8F43;
      }
    }

    /* ════════════════════════════════════════════════════════════════════
       FOOTER STYLES
    ════════════════════════════════════════════════════════════════════ */
    .site-footer {
      background: #243455;
      color: rgba(255,255,255,0.8);
      padding: 40px 0 0;
      margin-top: 0;
    }

    .site-footer__container {
      max-width: 1366px;
      margin-inline: auto;
      padding-inline: 24px;
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
      color: #ffffff;
      margin: 0 0 12px;
      letter-spacing: 0.1px;
    }

    .site-footer__col-link {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 13px;
      line-height: 20px;
      color: rgba(255,255,255,0.65);
      margin: 0 0 8px;
      letter-spacing: 0.1px;
      cursor: pointer;
      transition: color 150ms ease;

      &:hover { color: #ffffff; }
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
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      transition: border-color 150ms ease, background 150ms ease;

      &:hover { background: rgba(255,255,255,0.1); }
    }

    .site-footer__libro {
      opacity: 0.6;
      margin-top: 8px;
    }

    .site-footer__apps {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .site-footer__app-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      width: fit-content;
      transition: background 150ms ease;

      &:hover { background: rgba(255,255,255,0.1); }
    }

    .site-footer__bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 20px 0;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }
  `],
})
export class App {
  readonly cartService = inject(CartService);

  readonly navCategories = [
    { label: 'Dermocosmetica', route: '/productos' },
    { label: 'Farmacia',       route: '/productos' },
    { label: 'Bienestar',      route: '/productos' },
    { label: 'Infantil',       route: '/productos' },
    { label: 'Fotoprotección', route: '/productos' },
    { label: 'Inkaclub',       route: '/productos' },
    { label: 'Tienda 24 hrs.', route: '/productos' },
    { label: 'Catálogos',      route: '/productos' },
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
