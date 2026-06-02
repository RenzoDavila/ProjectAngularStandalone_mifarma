# Mifarma — E-commerce Farmacia (Angular SSR Challenge)

[![Angular](https://img.shields.io/badge/Angular-21.x-DD0031?style=flat-square&logo=angular)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![SSR](https://img.shields.io/badge/SSR-Angular_Universal-FF6B00?style=flat-square)](https://angular.io/guide/ssr)
[![Jest](https://img.shields.io/badge/Testing-Jest_%2B_Testing_Library-C21325?style=flat-square&logo=jest)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Documentación del challenge técnico orientado a la construcción de un e-commerce para farmacia online. El proyecto ha sido desarrollado utilizando Angular 17+ con Server-Side Rendering (SSR), manejo de estado a través de Signals, arquitectura basada en Feature-Sliced Design y un pipeline de Integración y Despliegue Continuo (CI/CD) diseñado para un entorno de Virtual Private Server (VPS).

---

## 1. Estructura de Directorios

```text
mifarma/
├── .github/
│   └── workflows/
│       └── deploy.yml             # Pipeline CI/CD: Test → Build → Deploy en VPS
├── src/
│   ├── app/
│   │   ├── core/                  # Servicios Singleton (providedIn: 'root')
│   │   │   ├── services/
│   │   │   │   ├── product-mock.service.ts  # Mock de catálogo y lógica de búsqueda semántica
│   │   │   │   ├── cart.service.ts          # Gestión del carrito mediante Optimistic UI
│   │   │   │   └── analytics.service.ts     # Seguimiento de eventos con control de frecuencia (throttle)
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── shared/                # Componentes reutilizables (dumb components)
│   │   │   ├── components/
│   │   │   │   └── product-card/
│   │   │   │       └── product-card.component.ts
│   │   │   └── directives/
│   │   │       └── track-event.directive.ts
│   │   ├── features/              # Divisiones lógicas por funcionalidad (smart components)
│   │   │   ├── plp/               # Product Listing Page
│   │   │   │   ├── plp.component.ts
│   │   │   │   └── plp.component.scss
│   │   │   ├── pdp/               # Product Detail Page
│   │   │   │   ├── pdp.component.ts
│   │   │   │   ├── pdp.component.scss
│   │   │   │   └── pdp.component.spec.ts    # Pruebas unitarias de selección de variantes
│   │   │   └── cart/
│   │   ├── app.component.ts
│   │   ├── app.config.ts          # Configuración global (withViewTransitions, provideRouter)
│   │   └── app.routes.ts          # Enrutamiento con carga diferida (Lazy Loading) para PLP / PDP
│   ├── design-tokens/
│   │   ├── _tokens.base.scss      # Primitivas CSS compartidas (espaciado, tipografía)
│   │   ├── _tokens.inkafarma.scss # Variables CSS específicas de la marca Inkafarma
│   │   └── _tokens.mifarma.scss   # Variables CSS específicas de la marca Mifarma (sobreescritura)
│   └── styles/
│       └── styles.scss            # Punto de entrada de estilos globales y transiciones
├── ecosystem.config.js            # Configuración de cluster PM2 para producción SSR
├── nginx.conf                     # Configuración de Proxy Inverso Nginx, SSL y compresión gzip
├── jest.config.js                 # Configuración de Jest, ts-jest y Testing Library
└── setup-jest.ts                  # Configuración de aserciones para @testing-library/jest-dom
```

---

## 2. Instrucciones de Despliegue Local

```bash
# Clonar el repositorio e instalar dependencias
git clone https://github.com/tu-usuario/mifarma.git
cd mifarma
npm install

# Inicializar servidor de desarrollo con Hot Module Replacement (HMR)
npm start

# Compilar proyecto para entorno de producción con Server-Side Rendering (SSR)
npm run build

# Ejecutar el servidor Node.js localmente
npm run serve:ssr:mifarma

# Ejecución de pruebas unitarias
npm test
npm test -- --coverage
```

---

## 3. Decisiones Arquitectónicas

### Feature-Sliced Design (FSD)

Se ha implementado la metodología Feature-Sliced Design estableciendo una regla de dependencias estrictamente unidireccional entre los módulos `core/`, `shared/` y `features/`:

- **`core/`**: Exclusivo para servicios registrados como singleton (`providedIn: 'root'`). No posee dependencias hacia módulos de funcionalidades.
- **`shared/`**: Contiene componentes presentacionales ("dumb components") diseñados para alta reutilización, abstrayéndolos de la lógica de negocio.
- **`features/`**: Contiene componentes de negocio ("smart components") encargados de orquestar servicios. Poseen dependencias válidas únicamente hacia `core/` y `shared/`.

Esta jerarquía mitiga el riesgo de regresiones y asegura que la integración de nuevas funcionalidades mantenga la cohesión del sistema.

### Componentes Independientes (Standalone Components)

Toda la aplicación ha sido diseñada utilizando componentes con la configuración `standalone: true`. Esta decisión arquitectónica prescinde del paradigma basado en `NgModules`, facilitando una optimización más exhaustiva del tamaño del bundle final a través de un proceso de *tree-shaking* a nivel de componente.

---

## 4. Respuestas a Requerimientos Técnicos

### 4.1. Decisiones de Optimización de Rendimiento

**a) Implementación de NgOptimizedImage y directiva `priority` para Largest Contentful Paint (LCP)**

La adopción de `NgOptimizedImage` representa la optimización individual de mayor impacto sobre la métrica LCP. La atribución `priority=true` induce al compilador de Angular a ejecutar las siguientes acciones automatizadas:
- Inserción del atributo `fetchpriority="high"` dentro del elemento `<img>`, escalando la prioridad del recurso a nivel de navegador.
- Durante el ciclo de renderizado en el servidor (SSR), el sistema inyecta una etiqueta `<link rel="preload" as="image">` en la cabecera HTML, iniciando la descarga antes del análisis semántico del documento.
- Desactivación de la carga diferida (`loading="lazy"`) para la imagen catalogada como LCP, garantizando su renderizado inmediato.

**b) Server-Side Rendering (SSR) mediante `@angular/ssr`**

La delegación del renderizado inicial al servidor provee mejoras medibles en métricas críticas (Core Web Vitals):
- **First Contentful Paint (FCP)**: Reducción sustancial del tiempo de pintado al entregar el DOM completo desde la respuesta inicial.
- **Largest Contentful Paint (LCP)**: Estabilización del proceso de descubrimiento de la imagen LCP, ya que ésta es parte integral del documento HTML recibido.
- **Technical SEO**: Aseguramiento de accesibilidad para rastreadores de motores de búsqueda que carecen de capacidad de ejecución de JavaScript, facilitando la indexación temprana.
- **Time to Interactive (TTI)**: La funcionalidad `withEventReplay()` retiene las interacciones del usuario ocurridas previo a la fase de hidratación del framework, para ejecutarlas de manera diferida.

**c) Bloques Diferibles (`@defer`)**

```typescript
@defer (on viewport; prefetch on idle) {
  <app-cross-selling-carousel />
} @placeholder { ... }
```

La estrategia de hidratación parcial permite excluir componentes no críticos (e.g., el carrusel de productos relacionados) de la ruta crítica de renderizado inicial. Su carga solo es ejecutada bajo demanda semántica (`on viewport`) y precargada durante tiempos inactivos (`prefetch on idle`), aliviando la carga computacional inicial del hilo principal.

**d) Carga Diferida de Rutas (Lazy Loading)**

Las vistas de lista de productos (PLP) y detalle de producto (PDP) se han encapsulado en fragmentos (chunks) independientes. El enrutador de Angular solicita exclusivamente el archivo binario necesario para la vista solicitada.

---

### 4.2. Estrategia Multi-marca (White-label Architecture)

**Implementación de Tokens de Diseño y Propiedades Personalizadas CSS**

El diseño establece tres capas jerárquicas:

**Nivel 1: Primitivas Base (`_tokens.base.scss`)**
Contiene constantes de escala geométrica (espaciados, tipografías, dimensiones) inmutables a nivel de negocio.

**Nivel 2: Alias de Identidad (`_tokens.inkafarma.scss`, `_tokens.mifarma.scss`)**
Asigna valores específicos de marca vinculados mediante selectores de atributo en la raíz del documento:
```css
[data-brand="mifarma"] {
  --color-brand-primary: hsl(352, 78%, 46%);
}
[data-brand="inkafarma"] {
  --color-brand-primary: hsl(144, 58%, 38%);
}
```

**Nivel 3: Consumo en Componentes**
Los componentes se limitan al consumo de variables genéricas (`var(--color-brand-primary)`). La conmutación de marca en tiempo de ejecución (o desde el servidor SSR basado en el dominio de petición HTTP) requiere únicamente la modificación de la etiqueta `<body data-brand="x">`, sin requerir refactorización a nivel aplicativo.

---

### 4.3. Resolución de Anomalías en Largest Contentful Paint (LCP)

**Diagnóstico Sistemático**

Ante reportes de degradación en producción, el proceso inicial radica en la identificación del elemento LCP exacto mediante auditoría profunda:
```bash
npx lighthouse https://mifarma.tudominio.com/producto/prod-001 \
  --output=json --output-path=lcp-report.json
```

Las medidas de contención contempladas incluyen:

1. **Latencia Alta de Primer Byte (TTFB > 600ms)**
   - Despliegue de estrategias de almacenamiento en caché de fragmentos renderizados desde el nivel del Proxy Inverso (Nginx `proxy_cache`).
   - Evaluación de Streaming SSR para distribución escalonada del documento HTML.

2. **Entrega Subóptima de Imágenes Críticas**
   - Integración obligatoria de una Content Delivery Network (CDN) configurada para negociar formatos de alta compresión (WebP/AVIF) dinámicamente.

3. **Interferencias en la Ruta Crítica de Renderizado**
   - Confirmación de la correcta ejecución del servicio de *Inlining* para el CSS crítico (`inlineCriticalCss: true`) y perfilado de rendimiento mediante `chrome://tracing`.

| Indicador | Límite Técnico |
|-----------|----------------|
| LCP       | < 2.5s         |
| FID/INP   | < 200ms        |
| CLS       | < 0.1          |
| TTFB      | < 600ms        |

---

### 4.4. Mitigación de Eventos Analíticos Duplicados

**Estrategia de Defensa Multicapa:**

**Capa 1: Limitación de Frecuencia (Throttle) a Nivel de Servicio**
```typescript
this._eventBus$.pipe(
  throttleTime(500, undefined, { leading: true, trailing: false })
).subscribe(event => this._dispatch(event));
```
El bus de eventos central procesa las solicitudes respetando ventanas de 500ms, descartando llamadas subsecuentes idénticas originadas por eventos de doble clic.

**Capa 2: Control del Ciclo de Vida del Componente**
La directiva personalizada de seguimiento gestiona sus subscripciones utilizando el operador `takeUntilDestroyed()`, erradicando la ejecución de eventos en componentes desmontados.

**Capa 3: Salvaguarda de Entorno SSR**
```typescript
private _dispatch(event): void {
  if (typeof window === 'undefined') return;
}
```
Inhibe la emisión inorgánica de eventos hacia las APIs de DataLayer durante los ciclos de ejecución del entorno Node.js.

---

### 4.5. Consideraciones sobre Posicionamiento Orgánico (SEO)

**a) Renderizado desde el Servidor (SSR)**
Garantiza el abastecimiento de un HTML semántico estructurado para los rastreadores web síncronos (e.g., motores secundarios y clientes de redes sociales).

**b) Metaetiquetas Dinámicas**
Modificación paramétrica de las etiquetas `<title>` y `<meta name="description">` mediante inyección directa en el encabezado (`<head>`), respetando los límites canónicos de 155 caracteres.

**c) Datos Estructurados (Schema.org)**
Emisión nativa del marcado semántico en formato microdatos (o JSON-LD) para las entidades `Product`, `BreadcrumbList` y `AggregateRating`, incentivando la aparición en fragmentos enriquecidos (Rich Snippets).

**d) Higiene de Enlaces y Arquitectura**
Uso mandatorio de la etiqueta `<link rel="canonical">` previniendo penalizaciones algorítmicas por duplicidad en variantes del mismo producto, soportado por rutas lógicas (/producto/{identificador-semantico}).

---

## 5. Pruebas Automatizadas

```bash
# Ejecución completa de suites de pruebas
npm test

# Ejecución bajo modelo de observación
npm test -- --watch

# Emisión de reportes de cobertura de código
npm test -- --coverage
```

La suite `pdp.component.spec.ts` garantiza la integridad de la funcionalidad primaria:
1. Exactitud de propagación de cambios de variante de producto.
2. Actualización de atributos de accesibilidad técnica (`aria-pressed`).
3. Interconexión íntegra con la inyección de dependencias hacia el `CartService`.

---

## 6. Procedimiento de Despliegue (Vercel Serverless)

La aplicación ha sido configurada bajo una arquitectura Serverless utilizando la plataforma Vercel, delegando la responsabilidad de infraestructura física y aprovechando sus capacidades nativas de SSR (Server-Side Rendering) y distribución global (Edge Network).

Enlace de producción: [Mifarma SSR Demo](https://project-angular-standalone-mifarma.vercel.app/productos)

### Protocolo de Integración y Despliegue Continuo (CI/CD)

El flujo de Integración y Entrega Continua (CI/CD) está completamente automatizado mediante la conexión directa entre Vercel y el repositorio de código fuente (GitHub).

**Procedimiento para la actualización de la aplicación:**

Para desplegar una nueva versión que contenga correcciones, nuevas funcionalidades o cambios de configuración, el flujo se centraliza exclusivamente en el control de versiones local:

1. Confirmar los cambios mediante Git (`git commit`) en la rama de despliegue principal (generalmente `main`).
2. Sincronizar dichos cambios con el repositorio remoto ejecutando un `git push`.

```text
Estructura del proceso de actualización automatizado:
Push hacia rama 'main'
  └─ Intercepción de Webhook por Vercel
       ├─ Fase 1: Descarga determinista de dependencias
       ├─ Fase 2: Compilación de artefactos de producción (Angular SSR Builder)
       ├─ Fase 3: Aprovisionamiento de Funciones Serverless para Node.js
       └─ Fase 4: Sustitución inmutable (Zero-Downtime) y distribución en CDN
```

Este esquema de "Despliegues Atómicos" garantiza que la plataforma siempre responda con la versión actual intacta si la nueva compilación resulta defectuosa, anulando cualquier ventana de indisponibilidad.

---

## 7. Pila Tecnológica Consolidada

| Clasificación | Tecnología Seleccionada | Justificación Técnica |
|---------------|-------------------------|-----------------------|
| Marco de Trabajo | Angular 21 + SSR | Rendimiento FCP/LCP superior y robustez SEO. |
| Gestión de Estado | Signals API | Sincronización fina de UI exenta del overhead de Zone.js. |
| Tratamiento de Streams | RxJS | Control de eventos de alta frecuencia, peticiones HTTP asíncronas e interceptores de estado. |
| Procesamiento de Estilos | SCSS + CSS Custom Properties | Implementación white-label bajo coste marginal nulo en ejecución. |
| Entorno de Pruebas | Jest + Angular Testing Library | Aseguramiento de calidad centrado en comportamiento real del usuario. |
| Agente de Ejecución | PM2 Cluster Mode | Orquestación eficiente de recursos computacionales multinúcleo en NodeJS. |
| Capa Proxy / HTTP | Nginx | Terminación SSL, balanceo de carga y políticas de compresión de red. |

---

## 8. Licenciamiento

Este código fuente se encuentra distribuido bajo los términos de la Licencia MIT.
Autor: Renzo Chávez — Challenge Técnico 2026.
