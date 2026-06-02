import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// ─────────────────────────────────────────────
// DOMAIN MODELS
// ─────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  label: string;           // e.g. "Caja x 10 tab" | "Sobre x 1 sach"
  price: number;
  originalPrice?: number;
  sku: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  imageUrl: string;
  images: string[];
  category: string;
  tags: string[];           // usado para búsqueda semántica
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  prescription: boolean;
  crossSelling?: string[];  // IDs de productos relacionados
}

// ─────────────────────────────────────────────
// SEMANTIC SEARCH MAPPING
// Simula un motor de búsqueda RAG/IA agéntica:
// términos de síntomas → categorías/tags de producto
// ─────────────────────────────────────────────
const SEMANTIC_MAP: Record<string, string[]> = {
  'me duele la cabeza': ['analgesico', 'dolor', 'cefalea', 'antigripal'],
  'dolor de cabeza':    ['analgesico', 'dolor', 'cefalea'],
  'fiebre':             ['antipiretico', 'antigripal', 'fiebre', 'analgesico'],
  'gripe':              ['antigripal', 'resfrio', 'fiebre'],
  'resfriado':          ['antigripal', 'resfrio', 'descongestionante'],
  'me duele el cuerpo': ['analgesico', 'antigripal', 'dolor muscular'],
  'tos':                ['antitusivo', 'expectorante', 'resfrio'],
  'estomago':           ['antiacido', 'digestivo', 'gastritis'],
  'diarrea':            ['antidiarreico', 'hidratacion'],
  'alergia':            ['antihistaminico', 'alergia'],
  'presion alta':       ['antihipertensivo', 'cardiovascular'],
  'diabetes':           ['antidiabetico', 'glucosa'],
};

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    // Nombre exacto del Figma de Inkafarma
    name: 'Pharamol Antigripal 500 mg + 5 mg + 2 mg Tableta Recubierta',
    brand: 'INAMED PHARMA',
    description:
      '¿Qué es el PHARAMOL ANTIGRIPAL 500mg+5mg+2mg Tableta Recubierta y para qué se utiliza? ' +
      'Es un medicamento que contiene: paracetamol que funciona para aliviar los síntomas de dolor leves que lleguen al centro, ' +
      'también actúa en el cerebro para reducir la fiebre. La fenilamina es un descongestionante nasal o la clorfenamina pertenece a un grupo de medicamentos conocidos como antihistamínicos.',
    imageUrl: 'assets/images/pharamol-antigripal.svg',
    images: [
      'assets/images/pharamol-antigripal.svg',
      'assets/images/pharamol-antigripal-2.svg',
      'assets/images/pharamol-antigripal-3.svg',
    ],
    category: 'Gripe',
    tags: ['antigripal', 'analgesico', 'antipiretico', 'fiebre', 'cefalea', 'dolor', 'resfrio', 'gripe'],
    variants: [
      {
        id: 'v-001-sobre',
        label: 'Sobre',
        price: 1.80,
        originalPrice: 2.20,
        sku: '123456',
        stock: 200,
      },
      {
        id: 'v-001-caja',
        label: 'Caja',
        price: 12.50,
        originalPrice: 15.00,
        sku: '123457',
        stock: 50,
      },
    ],
    rating: 4.7,
    reviewCount: 1240,
    prescription: false,
    crossSelling: ['prod-002', 'prod-003', 'prod-004', 'prod-005'],
  },
  {
    id: 'prod-002',
    name: 'Ibuprofeno 400mg',
    brand: 'Genoma',
    description:
      'Antiinflamatorio no esteroideo (AINE). Eficaz para dolor, fiebre e inflamación. Indicado en cefalea, dolor muscular, articular y odontálgico.',
    imageUrl: 'assets/images/ibuprofeno.svg',
    images: ['assets/images/ibuprofeno.svg'],
    category: 'Analgésicos',
    tags: ['analgesico', 'antiinflamatorio', 'dolor', 'fiebre', 'antipiretico', 'cefalea', 'dolor muscular'],
    variants: [
      {
        id: 'v-002-caja',
        label: 'Caja x 20 tabletas',
        price: 8.9,
        originalPrice: 11.0,
        sku: 'IBU-400-CJ20',
        stock: 80,
      },
      {
        id: 'v-002-blister',
        label: 'Blíster x 4 tabletas',
        price: 2.5,
        sku: 'IBU-400-BL4',
        stock: 300,
      },
    ],
    rating: 4.5,
    reviewCount: 3890,
    prescription: false,
    crossSelling: ['prod-001', 'prod-004'],
  },
  {
    id: 'prod-003',
    name: 'Loratadina 10mg',
    brand: 'Labfarma',
    description:
      'Antihistamínico de segunda generación. Sin efecto sedante. Indicado para rinitis alérgica, urticaria y otras alergias cutáneas.',
    imageUrl: 'assets/images/loratadina.svg',
    images: ['assets/images/loratadina.svg'],
    category: 'Antihistamínicos',
    tags: ['antihistaminico', 'alergia', 'rinitis', 'urticaria'],
    variants: [
      {
        id: 'v-003-caja',
        label: 'Caja x 10 tabletas',
        price: 6.5,
        sku: 'LORA-10-CJ10',
        stock: 120,
      },
    ],
    rating: 4.6,
    reviewCount: 870,
    prescription: false,
    crossSelling: ['prod-002'],
  },
  {
    id: 'prod-004',
    name: 'Omeprazol 20mg',
    brand: 'Farmindustria',
    description:
      'Inhibidor de la bomba de protones. Reduce la producción de ácido gástrico. Indicado en gastritis, úlcera péptica y reflujo gastroesofágico.',
    imageUrl: 'assets/images/omeprazol.svg',
    images: ['assets/images/omeprazol.svg'],
    category: 'Gastrointestinales',
    tags: ['antiacido', 'digestivo', 'gastritis', 'estomago', 'reflujo', 'ulcera'],
    variants: [
      {
        id: 'v-004-caja',
        label: 'Caja x 14 cápsulas',
        price: 18.0,
        originalPrice: 22.0,
        sku: 'OME-20-CJ14',
        stock: 60,
      },
      {
        id: 'v-004-blister',
        label: 'Blíster x 2 cápsulas',
        price: 3.2,
        sku: 'OME-20-BL2',
        stock: 150,
      },
    ],
    rating: 4.8,
    reviewCount: 2100,
    prescription: false,
  },
  {
    id: 'prod-005',
    name: 'Metamizol 500mg (Dipirona)',
    brand: 'Teva',
    description:
      'Analgésico y antipirético potente. Indicado para dolores intensos que no responden a otros analgésicos, y fiebre alta refractaria.',
    imageUrl: 'assets/images/metamizol.svg',
    images: ['assets/images/metamizol.svg'],
    category: 'Analgésicos',
    tags: ['analgesico', 'antipiretico', 'dolor', 'fiebre', 'dolor muscular'],
    variants: [
      {
        id: 'v-005-caja',
        label: 'Caja x 10 tabletas',
        price: 7.5,
        sku: 'META-500-CJ10',
        stock: 90,
      },
    ],
    rating: 4.3,
    reviewCount: 560,
    prescription: false,
  },
];

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductMockService {
  /** Signal interno del catálogo completo */
  private readonly _catalog = signal<Product[]>(MOCK_PRODUCTS);

  /** Catálogo público (read-only) */
  readonly catalog = this._catalog.asReadonly();

  /**
   * Retorna todos los productos con un delay simulado de red.
   * El tipo Observable<Product[]> modela una futura llamada HTTP real.
   */
  getAll(): Observable<Product[]> {
    return of(MOCK_PRODUCTS).pipe(delay(300));
  }

  /**
   * Busca un producto por su ID.
   */
  getById(id: string): Observable<Product | undefined> {
    return of(MOCK_PRODUCTS.find((p) => p.id === id)).pipe(delay(150));
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * BÚSQUEDA SEMÁNTICA SIMULADA
   *
   * En lugar de hacer un simple `includes()` sobre el nombre,
   * resolvemos la query a "intenciones/síntomas" usando el SEMANTIC_MAP,
   * igual que lo haría un pipeline RAG:
   *   1. Query → embedding → vector store → IDs de tags semánticamente cercanos
   *   2. Aquí: Query → SEMANTIC_MAP → array de tags a buscar
   *   3. Luego: filtrar productos cuyo array `tags` tenga intersección
   *
   * Esto demuestra preparación para integración con motores de IA agéntica
   * (LangChain, Vertex AI Search, pgvector, etc.).
   * ─────────────────────────────────────────────────────────────────
   */
  search(rawQuery: string): Observable<Product[]> {
    const query = rawQuery.toLowerCase().trim();

    // 1. Intentar resolución semántica
    const resolvedTags = this._resolveSemanticTags(query);

    let results: Product[];

    if (resolvedTags.length > 0) {
      // 2a. Búsqueda por tags semánticos (intersección de arrays)
      results = MOCK_PRODUCTS.filter((p) =>
        p.tags.some((tag) => resolvedTags.includes(tag))
      );
    } else {
      // 2b. Fallback: búsqueda léxica en nombre, marca y descripción
      results = MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return of(results).pipe(delay(200));
  }

  /**
   * Resuelve una query en lenguaje natural a un conjunto de tags semánticos.
   * Emula el resultado de un retriever RAG (similaridad coseno > umbral).
   *
   * @param query - Texto en minúsculas ya normalizado
   * @returns Array de tags semánticos o array vacío si no hay match
   */
  private _resolveSemanticTags(query: string): string[] {
    for (const [symptom, tags] of Object.entries(SEMANTIC_MAP)) {
      // Match si la query CONTIENE la frase clave (permite variaciones)
      if (query.includes(symptom)) {
        return tags;
      }
    }

    // Búsqueda por token individual para mayor cobertura
    const queryTokens = query.split(/\s+/);
    for (const [symptom, tags] of Object.entries(SEMANTIC_MAP)) {
      const symptomTokens = symptom.split(/\s+/);
      if (symptomTokens.some((token) => queryTokens.includes(token))) {
        return tags;
      }
    }

    return [];
  }

  getByCategory(category: string): Observable<Product[]> {
    return of(MOCK_PRODUCTS.filter((p) => p.category === category)).pipe(delay(250));
  }

  getCrossSelling(ids: string[]): Observable<Product[]> {
    return of(MOCK_PRODUCTS.filter((p) => ids.includes(p.id))).pipe(delay(200));
  }
}
