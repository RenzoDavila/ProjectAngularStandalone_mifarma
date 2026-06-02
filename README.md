# 🏥 Mifarma — E-commerce Farmacia (Angular SSR Challenge)

[![Angular](https://img.shields.io/badge/Angular-21.x-DD0031?style=flat-square&logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![SSR](https://img.shields.io/badge/SSR-Angular_Universal-FF6B00?style=flat-square)](https://angular.io/guide/ssr)
[![Jest](https://img.shields.io/badge/Testing-Jest_%2B_Testing_Library-C21325?style=flat-square&logo=jest)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Challenge técnico de e-commerce para farmacia online con Angular 17+ SSR, Signals, Feature-Sliced Design y pipeline de CI/CD para VPS Hostinger.

---

## 📁 Árbol de Directorios

```
mifarma/
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD: Test → Build → Deploy VPS
├── src/
│   ├── app/
│   │   ├── core/                  # Singleton services (providedIn: 'root')
│   │   │   ├── services/
│   │   │   │   ├── product-mock.service.ts  # Catálogo + Búsqueda Semántica
│   │   │   │   ├── cart.service.ts          # Carrito con Optimistic UI
│   │   │   │   └── analytics.service.ts     # Event tracking con throttle
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── shared/                # Componentes reutilizables (dumb)
│   │   │   ├── components/
│   │   │   │   └── product-card/
│   │   │   │       └── product-card.component.ts
│   │   │   └── directives/
│   │   │       └── track-event.directive.ts
│   │   ├── features/              # Feature Slices (smart components)
│   │   │   ├── plp/               # Product Listing Page
│   │   │   │   ├── plp.component.ts
│   │   │   │   └── plp.component.scss
│   │   │   ├── pdp/               # Product Detail Page
│   │   │   │   ├── pdp.component.ts
│   │   │   │   ├── pdp.component.scss
│   │   │   │   └── pdp.component.spec.ts    # Test crítico: variantes
│   │   │   └── cart/
│   │   ├── app.component.ts
│   │   ├── app.config.ts          # withViewTransitions() + provideRouter()
│   │   └── app.routes.ts          # Lazy routes PLP / PDP
│   ├── design-tokens/
│   │   ├── _tokens.base.scss      # Primitivas compartidas (spacing, typography)
│   │   ├── _tokens.inkafarma.scss # CSS vars brand Inkafarma
│   │   └── _tokens.mifarma.scss   # CSS vars brand Mifarma (override)
│   └── styles/
│       └── styles.scss            # Entry point + View Transitions globals
├── ecosystem.config.js            # PM2 cluster config (SSR production)
├── nginx.conf                     # Nginx reverse proxy + SSL + gzip
├── jest.config.js                 # Jest + ts-jest + Testing Library
└── setup-jest.ts                  # Matchers de @testing-library/jest-dom
```

---

## 🚀 Inicio Rápido

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/mifarma.git
cd mifarma
npm install

# Desarrollo (con HMR)
npm start

# Build SSR producción
npm run build

# Ejecutar SSR localmente
npm run serve:ssr:mifarma

# Tests
npm test
npm test -- --coverage
```

---

## 🏗️ Decisiones de Arquitectura

### Feature-Sliced Design (FSD)

La estructura `core/` → `shared/` → `features/` aplica una regla de dependencias unidireccional:

- **`core/`** → Solo servicios singleton (`providedIn: 'root'`). Sin dependencias de features.
- **`shared/`** → Componentes "dumb" reutilizables. Sin lógica de negocio.
- **`features/`** → Componentes "smart" que orquestan servicios. Solo importan de `core/` y `shared/`.

Esta separación garantiza que agregar una nueva feature (ej: checkout) no rompa las existentes.

### Standalone Components (Cero NgModules)

Todos los componentes usan `standalone: true`. Esto elimina el boilerplate de NgModules y permite tree-shaking granular por componente, reduciendo el bundle size.

---

## ❓ Respuestas Técnicas del Challenge

### 1. ¿Qué decisiones tomaste para mejorar la performance?

**a) NgOptimizedImage + `priority` en la imagen LCP (PDP)**

`NgOptimizedImage` es la decisión con mayor impacto individual en LCP. Con `priority=true`, Angular automáticamente:
- Inyecta `fetchpriority="high"` en el atributo del `<img>` → el browser lo carga antes que otros recursos.
- En SSR, genera un `<link rel="preload" as="image">` en el `<head>` del HTML generado → el browser inicia la descarga **antes** de que el parser alcance la etiqueta `<img>`.
- Deshabilita el lazy loading nativo para la imagen LCP (las otras imágenes usan `loading="lazy"`).

Sin estos hints, el browser descubre la imagen LCP tarde (después de parsear el HTML, ejecutar JS y hacer layout), lo que puede sumar 500-1000ms al LCP.

**b) SSR (Server-Side Rendering) con `@angular/ssr`**

El HTML llega al browser completamente renderizado. Beneficios medibles en Core Web Vitals:
- **FCP (First Contentful Paint)** mejora drásticamente: el usuario ve contenido desde el primer byte HTML, sin esperar que descargue, parsee y ejecute el bundle JS.
- **LCP** mejora porque la imagen principal ya está en el HTML inicial, no se inserta dinámicamente por JS.
- **SEO técnico**: los crawlers de Google leen el contenido sin necesidad de renderizar JS (aunque Googlebot sí renderiza JS, los crawlers de redes sociales no).
- **TTI (Time to Interactive)**: con `withEventReplay()`, los clics del usuario antes de la hidratación se capturan y reproducen automáticamente.

**c) `@defer` para el carrusel de Cross-Selling**

```typescript
@defer (on viewport; prefetch on idle) {
  <app-cross-selling-carousel />
} @placeholder { ... }
```

- `on viewport`: Angular no renderiza el carrusel hasta que el usuario hace scroll hacia esa sección. El componente no se descarga, no se parsea, no se renderiza.
- `prefetch on idle`: cuando el browser está libre (requestIdleCallback), pre-descarga el chunk del componente en background. El resultado: el carrusel parece cargar instantáneamente cuando aparece en el viewport.
- Impacto en LCP: elimina código del critical rendering path. Menos JS → parser más rápido → LCP más bajo.

**d) Lazy Loading de Rutas**

PLP y PDP son chunks separados (`loadComponent`). El router descarga solo el chunk necesario para la ruta actual.

---

### 2. ¿Cómo estructurarías esta solución para soportar múltiples marcas?

**Arquitectura Multi-brand con CSS Custom Properties + Design Tokens**

El modelo implementado separa tres capas:

**Capa 1 — Primitivas (`_tokens.base.scss`)**
Variables de escala (spacing, typography, radios) que no cambian entre marcas. Se usan como fuente única de verdad para valores numéricos.

**Capa 2 — Alias de marca (`_tokens.inkafarma.scss`, `_tokens.mifarma.scss`)**
Mapean las primitivas a nombres semánticos en `:root` o `[data-brand="X"]`:
```css
[data-brand="mifarma"] {
  --color-brand-primary: hsl(352, 78%, 46%);  /* Rojo Mifarma */
}
[data-brand="inkafarma"] {
  --color-brand-primary: hsl(144, 58%, 38%);  /* Verde Inkafarma */
}
```

**Capa 3 — Componentes**
Solo usan `var(--color-brand-primary)`, nunca valores hardcoded. El swap de marca es un cambio de atributo HTML, **cero cambios en componentes**.

**Implementación en SSR:**
El servidor lee el dominio del request (`mifarma.pe` vs `inkafarma.pe`) y establece `<body data-brand="mifarma">` en el HTML generado. El cliente hidrata sobre ese DOM.

**Escalabilidad:**
Agregar una nueva marca (ej: "Pharmaone") requiere solo:
1. Crear `_tokens.pharmaone.scss` con sus variables
2. En el servidor, mapear `pharmaone.pe` → `data-brand="pharmaone"`

Sin tocar un solo componente Angular.

---

### 3. Si esta página presenta problemas de LCP en producción, ¿cómo lo abordarías?

**Diagnóstico sistemático (proceso antes de optimizar)**

Primero identifico el elemento LCP exacto y su causa con:
```bash
# Lighthouse CI en el entorno de producción real (no localhost)
npx lighthouse https://mifarma.tudominio.com/producto/prod-001 \
  --output=json --output-path=lcp-report.json
```

Los problemas típicos de LCP en una PDP y sus soluciones:

**Problema A: Imagen LCP con `fetchpriority` bajo**
- Síntoma: el waterfall de red muestra la imagen LCP iniciando tarde.
- Solución: `NgOptimizedImage` con `priority=true` (ya implementado). Verificar que no haya otro `<img priority>` que "robe" el slot.

**Problema B: TTFB alto (>600ms)**
- Causa: la petición SSR tarda en resolver (base de datos lenta, cold start de Node.js).
- Solución A: Caché de respuestas SSR en Nginx con `proxy_cache`. Para páginas de producto, cachear 60s el HTML completo.
- Solución B: Streaming SSR (`renderApplication` con `inlineCriticalCss`) para enviar el `<head>` al browser mientras el body se sigue generando.
- Solución C: Distribuir el edge con CDN (Cloudflare Workers) para SSR en el nodo más cercano al usuario.

**Problema C: Imagen alojada en servidor lento**
- Solución: migrar imágenes a un CDN (Cloudflare Images, Imgix) con compresión automática a WebP/AVIF y entrega desde el PoP más cercano.

**Problema D: Render-blocking CSS/JS**
- Verificar que el CSS crítico esté inlined en el `<head>` (Angular lo hace automáticamente en SSR con `inlineCriticalCss: true`).
- Analizar con `chrome://tracing` o Chrome DevTools Performance panel.

**KPIs objetivo:**
| Métrica | Objetivo |
|---------|----------|
| LCP     | < 2.5s   |
| FID/INP | < 200ms  |
| CLS     | < 0.1    |
| TTFB    | < 600ms  |

---

### 4. ¿Cómo evitarías que eventos de Analytics se disparen múltiples veces en una SPA?

**El problema en una SPA:**
En una SPA, el usuario puede:
1. Hacer doble-clic accidental en "Agregar al carrito"
2. Navegar rápidamente hacia/desde una página, disparando `view_item` dos veces
3. En SSR con hidratación, un evento puede ejecutarse tanto en el servidor como en el cliente

**Soluciones implementadas (defense in depth):**

**Nivel 1 — `throttleTime` en el `AnalyticsService`:**
```typescript
this._eventBus$.pipe(
  throttleTime(500, undefined, { leading: true, trailing: false })
).subscribe(event => this._dispatch(event));
```
Todos los eventos pasan por un Subject con throttle de 500ms. El primer evento se procesa; los siguientes dentro de la ventana se descartan silenciosamente.

**Nivel 2 — Directiva `[trackEvent]` con `throttleTime + takeUntilDestroyed`:**
```html
<button trackEvent [trackEventName]="'add_to_cart'" ...>
```
`takeUntilDestroyed(destroyRef)` cancela la suscripción automáticamente cuando el componente se destruye, previniendo eventos fantasma de componentes desmontados.

**Nivel 3 — Guard de SSR:**
```typescript
private _dispatch(event): void {
  if (typeof window === 'undefined') return; // SSR guard
  // ...
}
```
En Node.js (SSR), `window` no existe. Este guard previene que los eventos se "disparen" en el servidor, donde no hay GA4 ni dataLayer.

**Nivel 4 — `distinctUntilChanged` para eventos de tipo `view_*`:**
Para `view_item`, aplicar `distinctUntilChanged` evita re-disparos si el mismo componente se re-renderiza (ej: por un cambio de Signal no relacionado).

**En producción (GTM):**
La capa de deduplicación final es GTM con reglas de "trigger exception" para evitar duplicados en eventos de sesión.

---

### 5. ¿Qué consideraciones SEO tendrías en cuenta para esta página en un entorno real?

**a) SSR es condición sine qua non**

Sin SSR, los crawlers que no ejecutan JS (Bing, Pinterest, WhatsApp, Slack) no ven ningún contenido. Google sí renderiza JS, pero lo hace en una segunda cola diferida (días después del crawleo inicial). SSR garantiza que el HTML indexable esté disponible en el primer request.

**b) `<title>` y `<meta name="description">` dinámicos por producto**

```typescript
// En PdpComponent.ngOnInit()
this.titleService.setTitle(`${product.name} — Comprar online | Mifarma`);
this.metaService.updateTag({
  name: 'description',
  content: `${product.description.slice(0, 155)}. Precio: S/ ${price}.`
});
```

La meta description está limitada a 155 caracteres (snippet visible en SERPs). Se inyecta con el servicio `Meta` de Angular, que en SSR escribe directamente en el `<head>` del HTML.

**c) Schema.org (Structured Data)**

Para productos de farmacia, implementar `Product` schema:
```html
<div itemscope itemtype="https://schema.org/Product">
  <span itemprop="name">{{ product.name }}</span>
  <span itemprop="price" content="{{ price }}">S/ {{ price }}</span>
  <meta itemprop="priceCurrency" content="PEN" />
</div>
```
Habilita Rich Results (precio, rating, disponibilidad) en los SERPs → mayor CTR.

También implementado: `BreadcrumbList` y `AggregateRating` schemas.

**d) URLs semánticas y canónicas**

- Estructura: `/producto/{id-slug}` (ej: `/producto/pharamol-antigripal-caja-10-tab`)
- `<link rel="canonical">` para evitar contenido duplicado entre variantes
- Sitemap XML generado programáticamente con todas las URLs de productos

**e) Core Web Vitals como factor de ranking**

Google usa CWV como factor de ranking desde 2021. Las optimizaciones de LCP, CLS e INP son también optimizaciones de SEO directo.

**f) `<hreflang>` para contenido multi-idioma**

Si se expande a otros países (Bolivia, Ecuador), declarar alternativas de idioma/región para evitar que Google las trate como contenido duplicado.

**g) Evitar contenido bloqueado por JavaScript**

Usar `@defer` solo para contenido no crítico para SEO (reseñas, cross-selling). El H1, precio y descripción siempre deben estar en el HTML del servidor.

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm test -- --watch

# Con cobertura
npm test -- --coverage

# Test específico
npm test -- --testPathPattern=pdp.component.spec
```

**Test crítico: Selector de variantes (PDP)**

El test `pdp.component.spec.ts` verifica que:
1. El precio de la variante inicial (Caja) se muestra correctamente
2. Al seleccionar "Sobre x 1 tableta", el precio cambia a S/ 1.80
3. `aria-pressed` se actualiza en cada botón de variante
4. `CartService.addItem` recibe la variante correcta al agregar al carrito

---

## 🚀 Deploy en VPS Hostinger (SSR)

### Requisitos del servidor

```bash
# Node.js 20+ LTS
nvm install 20 && nvm use 20

# PM2 (gestor de procesos)
npm install -g pm2

# Nginx
apt-get install nginx certbot python3-certbot-nginx
```

### Deploy manual inicial

```bash
# 1. Build en tu máquina local
npm run build

# 2. Subir dist/ al VPS
rsync -avz ./dist/ usuario@tu-vps:/var/www/mifarma/dist/

# 3. En el VPS: instalar deps y arrancar
cd /var/www/mifarma
npm ci --omit=dev
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Genera comando para autostart en reboot

# 4. Configurar Nginx
cp nginx.conf /etc/nginx/sites-available/mifarma
ln -s /etc/nginx/sites-available/mifarma /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 5. SSL con Let's Encrypt
certbot --nginx -d mifarma.tudominio.com
```

### CI/CD Automático (GitHub Actions)

Cada push a `main` dispara el pipeline:

```
Push → main
  └─ Job: build-and-test
       ├─ npm ci
       ├─ npm test (Jest)
       └─ npm run build (SSR)
            └─ Job: deploy (si build OK)
                 ├─ rsync dist/ → VPS
                 ├─ SSH: npm ci --omit=dev
                 ├─ SSH: pm2 reload (Zero-Downtime)
                 └─ Health check HTTP 200
```

**Secrets requeridos en GitHub:**

| Secret | Descripción |
|--------|-------------|
| `VPS_HOST` | IP o dominio del VPS |
| `VPS_USER` | Usuario SSH |
| `VPS_SSH_KEY` | Llave privada SSH |
| `VPS_PORT` | Puerto SSH (default: 22) |

### Zero-Downtime Reload

```bash
# pm2 reload (no pm2 restart) recarga workers uno a uno:
# Worker 1 levanta → acepta requests → Worker 0 se cierra
# Sin ningún 503 de downtime
pm2 reload ecosystem.config.js --env production
```

---

## 🎨 Multi-Brand Support

```html
<!-- Inkafarma (default) -->
<body data-brand="inkafarma">

<!-- Mifarma -->
<body data-brand="mifarma">
```

Los tokens de diseño se cargan via CSS Custom Properties. El cambio de marca no requiere recompilación ni cambios en los componentes Angular.

---

## 📊 Tech Stack Completo

| Categoría | Tecnología | Justificación |
|-----------|------------|---------------|
| Framework | Angular 21 + SSR | Core Web Vitals, SEO técnico |
| Estado | Signals (`signal()`, `computed()`) | Reactividad granular, sin Zone.js overhead |
| Estado async | RxJS (solo interceptores y streams complejos) | Interop con HTTP, throttle, takeUntilDestroyed |
| Estilos | SCSS + CSS Custom Properties | Multi-brand, Mobile-First, sin runtime overhead |
| Testing | Jest + @testing-library/angular | Sin DOM fake, tests centrados en el usuario |
| Process Manager | PM2 (cluster mode) | Zero-downtime reload, multi-CPU |
| Reverse Proxy | Nginx | Gzip, SSL termination, static assets cache |
| CI/CD | GitHub Actions | Automatización completa del pipeline |

---

## 📜 Licencia

MIT — Renzo Chávez · Challenge Técnico Mifarma 2026
