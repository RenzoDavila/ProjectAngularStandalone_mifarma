import { Injectable, signal } from '@angular/core';
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
  tags: string[];            // usado para búsqueda semántica
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  prescription: boolean;
  crossSelling?: string[];   // IDs de productos relacionados
}

// ─────────────────────────────────────────────
// SEMANTIC SEARCH MAPPING
// Simula un motor de búsqueda RAG/IA agéntica:
// términos de síntomas → categorías/tags de producto
// ─────────────────────────────────────────────
const SEMANTIC_MAP: Record<string, string[]> = {
  // --- Síntomas Generales ---
  'me duele la cabeza':  ['analgesico', 'dolor', 'cefalea', 'antigripal'],
  'dolor de cabeza':     ['analgesico', 'dolor', 'cefalea'],
  'fiebre':              ['antipiretico', 'antigripal', 'fiebre', 'analgesico'],
  'gripe':               ['antigripal', 'resfrio', 'fiebre'],
  'resfriado':           ['antigripal', 'resfrio', 'descongestionante'],
  'me duele el cuerpo':  ['analgesico', 'antigripal', 'dolor muscular'],
  'tos':                 ['antitusivo', 'expectorante', 'resfrio'],
  'alergia':             ['antihistaminico', 'alergia'],
  'presion alta':        ['antihipertensivo', 'cardiovascular'],
  'diabetes':            ['antidiabetico', 'glucosa'],

  // --- Dolores Específicos ---
  'dolor de muela':      ['analgesico', 'antiinflamatorio', 'salud bucal'],
  'dolor de diente':     ['analgesico', 'antiinflamatorio', 'salud bucal'],
  'dolor de espalda':    ['analgesico', 'antiinflamatorio', 'relajante muscular', 'dolor muscular'],
  'dolor de garganta':   ['analgesico', 'antiinflamatorio', 'antiseptico bucofaringeo', 'pastillas'],
  'colicos':             ['antiespasmodico', 'analgesico', 'salud femenina'],
  'dolor menstrual':     ['antiespasmodico', 'analgesico', 'salud femenina'],
  'dolor de rodilla':    ['analgesico', 'antiinflamatorio', 'topico', 'articulaciones'],
  'me golpee':           ['antiinflamatorio topico', 'analgesico', 'gel'],

  // --- Sistema Digestivo ---
  'estomago':            ['antiacido', 'digestivo', 'gastritis'],
  'diarrea':             ['antidiarreico', 'hidratacion'],
  'acidez':              ['antiacido', 'gastritis', 'salud digestiva'],
  'ardor en el estomago':['antiacido', 'gastritis', 'protector gastrico'],
  'gases':               ['antiflatulento', 'digestivo'],
  'estriñido':           ['laxante', 'fibra', 'salud digestiva'],
  'estreñimiento':       ['laxante', 'fibra', 'salud digestiva'],
  'nauseas':             ['antiemetico', 'mareos'],
  'vomito':              ['antiemetico', 'hidratacion', 'suero'],
  'indigestion':         ['digestivo', 'antiacido', 'enzimas'],
  'empacho':             ['digestivo', 'antiacido'],

  // --- Problemas Respiratorios ---
  'nariz tapada':        ['descongestionante', 'solucion salina', 'antigripal'],
  'congestion nasal':    ['descongestionante', 'antihistaminico', 'antigripal'],
  'flema':               ['mucolitico', 'expectorante', 'tos'],
  'asma':                ['broncodilatador', 'inhalador', 'respiratorio'],
  'me duele al tragar':  ['antiseptico bucofaringeo', 'analgesico', 'antiinflamatorio'],

  // --- Piel y Afecciones Tópicas ---
  'picadura':            ['antihistaminico topico', 'crema', 'alergia'],
  'quemadura':           ['crema regeneradora', 'analgesico topico', 'primeros auxilios'],
  'hongos':              ['antimicotico', 'cuidado del pie', 'dermatologia'],
  'pie de atleta':       ['antimicotico', 'cuidado del pie'],
  'picazon':             ['antihistaminico', 'calmante', 'dermatologia'],
  'rasquiña':            ['antihistaminico', 'calmante', 'dermatologia'],
  'acne':                ['dermatologia', 'antibacteriano topico', 'cuidado facial'],
  'granitos':            ['dermatologia', 'cuidado facial'],
  'herida':              ['antiseptico', 'gasa', 'curita', 'primeros auxilios'],
  'raspon':              ['antiseptico', 'curita', 'primeros auxilios'],

  // --- Ojos y Oídos ---
  'ojo rojo':            ['gotas oftalmologicas', 'lubricante ocular', 'irritacion'],
  'ojos secos':          ['lagrimas artificiales', 'lubricante ocular'],
  'conjuntivitis':       ['gotas oftalmologicas', 'antibiotico oftalmico'],
  'dolor de oido':       ['gotas oticas', 'analgesico', 'antiinflamatorio'],
  'oido tapado':         ['gotas oticas', 'limpieza auricular'],

  // --- Sueño, Energía y Bienestar Mental ---
  'no puedo dormir':     ['inductor del sueño', 'relajante', 'melatonina', 'insomnio'],
  'insomnio':            ['inductor del sueño', 'relajante', 'melatonina'],
  'estres':              ['vitaminas', 'relajante', 'suplemento', 'magnesio'],
  'ansiedad':            ['relajante', 'valeriana', 'suplemento natural'],
  'cansancio':           ['vitaminas', 'multivitaminico', 'suplemento', 'energia'],
  'fatiga':              ['vitaminas', 'multivitaminico', 'suplemento', 'energia'],
  'falta de energia':    ['vitaminas', 'multivitaminico', 'suplemento'],
  'defensas bajas':      ['vitamina c', 'inmunologia', 'suplemento', 'zinc'],

  // --- Bebés y Maternidad ---
  'rozadura':            ['crema antipañalitis', 'cuidado infantil', 'dermatologia'],
  'pañalitis':           ['crema antipañalitis', 'cuidado infantil', 'oxido de zinc'],
  'colico de bebe':      ['antigases infantil', 'cuidado infantil'],
  'fiebre en niños':     ['antipiretico infantil', 'analgesico infantil'],

  // --- Infecciones y Salud Íntima ---
  'infeccion urinaria':  ['antibiotico', 'analgesico urinario', 'salud intima'],
  'mal de orin':         ['analgesico urinario', 'salud intima', 'antibiotico'],
  'ardor al orinar':     ['analgesico urinario', 'salud intima'],
  'infeccion vaginal':   ['antimicotico', 'ovulos', 'salud intima'],
  'picazon intima':      ['antimicotico', 'crema intima', 'salud intima']
};

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Pharamol Antigripal 500 mg + 5 mg + 2 mg Tableta Recubierta',
    brand: 'INAMED PHARMA',
    description: 'Medicamento con paracetamol para aliviar dolor leve y reducir fiebre, fenilamina como descongestionante nasal y clorfenamina como antihistamínico.',
    imageUrl: 'assets/images/pharamol-antigripal.svg',
    images: [
      'assets/images/pharamol-antigripal.svg',
      'assets/images/pharamol-antigripal-2.svg',
      'assets/images/pharamol-antigripal-3.svg'
    ],
    category: 'Gripe',
    tags: ['antigripal', 'analgesico', 'antipiretico', 'fiebre', 'cefalea', 'dolor', 'resfrio', 'gripe'],
    variants: [
      { id: 'v-001-sobre', label: 'Sobre', price: 1.80, originalPrice: 2.20, sku: '123456', stock: 200 },
      { id: 'v-001-caja', label: 'Caja x 100', price: 150.00, sku: '123457', stock: 50 },
    ],
    rating: 4.7, reviewCount: 1240, prescription: false,
    crossSelling: ['prod-002', 'prod-003', 'prod-004', 'prod-012'],
  },
  {
    id: 'prod-002',
    name: 'Ibuprofeno 400mg',
    brand: 'Genoma',
    description: 'Antiinflamatorio no esteroideo (AINE). Eficaz para dolor, fiebre e inflamación. Indicado en cefalea, dolor muscular, articular y odontálgico.',
    imageUrl: 'assets/images/ibuprofeno.svg',
    images: ['assets/images/ibuprofeno.svg'],
    category: 'Analgésicos',
    tags: ['analgesico', 'antiinflamatorio', 'dolor', 'fiebre', 'antipiretico', 'cefalea', 'dolor muscular', 'salud bucal'],
    variants: [
      { id: 'v-002-caja', label: 'Caja x 20 tabletas', price: 8.9, originalPrice: 11.0, sku: 'IBU-400-CJ20', stock: 80 },
      { id: 'v-002-blister', label: 'Blíster x 4 tabletas', price: 2.5, sku: 'IBU-400-BL4', stock: 300 }
    ],
    rating: 4.5, reviewCount: 3890, prescription: false,
    crossSelling: ['prod-001', 'prod-004'],
  },
  {
    id: 'prod-003',
    name: 'Loratadina 10mg',
    brand: 'Labfarma',
    description: 'Antihistamínico de segunda generación. Sin efecto sedante. Indicado para rinitis alérgica, urticaria y otras alergias cutáneas.',
    imageUrl: 'assets/images/loratadina.svg',
    images: ['assets/images/loratadina.svg'],
    category: 'Antihistamínicos',
    tags: ['antihistaminico', 'alergia', 'rinitis', 'urticaria'],
    variants: [
      { id: 'v-003-caja', label: 'Caja x 10 tabletas', price: 6.5, sku: 'LORA-10-CJ10', stock: 120 }
    ],
    rating: 4.6, reviewCount: 870, prescription: false,
    crossSelling: ['prod-002'],
  },
  {
    id: 'prod-004',
    name: 'Omeprazol 20mg',
    brand: 'Farmindustria',
    description: 'Inhibidor de la bomba de protones. Reduce la producción de ácido gástrico. Indicado en gastritis, úlcera péptica y reflujo gastroesofágico.',
    imageUrl: 'assets/images/omeprazol.svg',
    images: ['assets/images/omeprazol.svg'],
    category: 'Gastrointestinales',
    tags: ['antiacido', 'digestivo', 'gastritis', 'estomago', 'reflujo', 'ulcera', 'protector gastrico', 'salud digestiva'],
    variants: [
      { id: 'v-004-caja', label: 'Caja x 14 cápsulas', price: 18.0, originalPrice: 22.0, sku: 'OME-20-CJ14', stock: 60 },
      { id: 'v-004-blister', label: 'Blíster x 2 cápsulas', price: 3.2, sku: 'OME-20-BL2', stock: 150 }
    ],
    rating: 4.8, reviewCount: 2100, prescription: false,
  },
  {
    id: 'prod-005',
    name: 'Metamizol 500mg (Dipirona)',
    brand: 'Teva',
    description: 'Analgésico y antipirético potente. Indicado para dolores intensos que no responden a otros analgésicos, y fiebre alta refractaria.',
    imageUrl: 'assets/images/metamizol.svg',
    images: ['assets/images/metamizol.svg'],
    category: 'Analgésicos',
    tags: ['analgesico', 'antipiretico', 'dolor', 'fiebre', 'dolor muscular'],
    variants: [
      { id: 'v-005-caja', label: 'Caja x 10 tabletas', price: 7.5, sku: 'META-500-CJ10', stock: 90 },
    ],
    rating: 4.3, reviewCount: 560, prescription: false,
  },
  {
    id: 'prod-006',
    name: 'Ketorolaco Trometamina 10mg',
    brand: 'Teva',
    description: 'Analgésico potente a corto plazo. Ideal para dolor de muela severo o dolor postoperatorio.',
    imageUrl: 'assets/images/ketorolaco.svg',
    images: ['assets/images/ketorolaco.svg'],
    category: 'Analgésicos',
    tags: ['analgesico', 'antiinflamatorio', 'dolor', 'salud bucal'],
    variants: [
      { id: 'v-006-blister', label: 'Blíster x 10 tabletas', price: 12.0, sku: 'KETO-10-BL10', stock: 150 }
    ],
    rating: 4.7, reviewCount: 950, prescription: true,
  },
  {
    id: 'prod-007',
    name: 'Buscapina Compuesta (Hioscina + Ibuprofeno)',
    brand: 'Sanofi',
    description: 'Antiespasmódico y analgésico. Tratamiento de los dolores espasmódicos y cólicos menstruales.',
    imageUrl: 'assets/images/buscapina.svg',
    images: ['assets/images/buscapina.svg'],
    category: 'Salud Femenina',
    tags: ['antiespasmodico', 'analgesico', 'salud femenina', 'dolor'],
    variants: [
      { id: 'v-007-caja', label: 'Caja x 20 tabletas', price: 24.5, sku: 'BUSC-COMP', stock: 110 }
    ],
    rating: 4.9, reviewCount: 5200, prescription: false,
  },
  {
    id: 'prod-008',
    name: 'Simeticona 80mg',
    brand: 'Gaseovet',
    description: 'Alivia rápidamente los síntomas de la retención de gases (flatulencia, hinchazón, presión).',
    imageUrl: 'assets/images/simeticona.svg',
    images: ['assets/images/simeticona.svg'],
    category: 'Gastrointestinales',
    tags: ['antiflatulento', 'digestivo', 'salud digestiva'],
    variants: [
      { id: 'v-008-gotas', label: 'Frasco Gotero 15ml', price: 15.2, sku: 'SIME-GOTAS', stock: 85 }
    ],
    rating: 4.4, reviewCount: 310, prescription: false,
  },
  {
    id: 'prod-009',
    name: 'Bisacodilo 5mg',
    brand: 'Dulcolax',
    description: 'Laxante estimulante de acción local. Proporciona alivio predecible del estreñimiento ocasional.',
    imageUrl: 'assets/images/bisacodilo.svg',
    images: ['assets/images/bisacodilo.svg'],
    category: 'Gastrointestinales',
    tags: ['laxante', 'salud digestiva'],
    variants: [
      { id: 'v-009-caja', label: 'Caja x 30 grageas', price: 28.0, sku: 'DULC-30', stock: 65 }
    ],
    rating: 4.6, reviewCount: 1800, prescription: false,
  },
  {
    id: 'prod-010',
    name: 'Oximetazolina Clorhidrato 0.05%',
    brand: 'Afrin',
    description: 'Descongestionante nasal en spray. Actúa en minutos y dura hasta 12 horas.',
    imageUrl: 'assets/images/oximetazolina.svg',
    images: ['assets/images/oximetazolina.svg'],
    category: 'Respiratorio',
    tags: ['descongestionante', 'antigripal', 'resfrio'],
    variants: [
      { id: 'v-010-spray', label: 'Spray 15ml', price: 22.9, sku: 'AFRIN-15', stock: 200 }
    ],
    rating: 4.8, reviewCount: 4100, prescription: false,
  },
  {
    id: 'prod-011',
    name: 'Ambroxol Jarabe 30mg/5ml',
    brand: 'Mucosolvan',
    description: 'Mucolítico y expectorante. Facilita la eliminación de flemas y alivia la tos productiva.',
    imageUrl: 'assets/images/ambroxol.svg',
    images: ['assets/images/ambroxol.svg'],
    category: 'Respiratorio',
    tags: ['mucolitico', 'expectorante', 'tos', 'resfrio'],
    variants: [
      { id: 'v-011-jarabe', label: 'Frasco 120ml', price: 19.5, sku: 'AMBRO-120', stock: 150 }
    ],
    rating: 4.7, reviewCount: 2300, prescription: false,
  },
  {
    id: 'prod-012',
    name: 'Crema de Hidrocortisona 1%',
    brand: 'Cortizone',
    description: 'Crema antipruriginosa tópica. Alivia picazón intensa por picaduras, eczemas y reacciones alérgicas.',
    imageUrl: 'assets/images/hidrocortisona.svg',
    images: ['assets/images/hidrocortisona.svg'],
    category: 'Dermatología',
    tags: ['antihistaminico topico', 'crema', 'alergia', 'dermatologia'],
    variants: [
      { id: 'v-012-tubo', label: 'Tubo x 15g', price: 14.5, sku: 'HIDRO-15', stock: 120 }
    ],
    rating: 4.5, reviewCount: 890, prescription: false,
  },
  {
    id: 'prod-013',
    name: 'Lágrimas Artificiales (Hialuronato de Sodio 0.4%)',
    brand: 'Hyabak',
    description: 'Solución lubricante para ojos secos, cansados o irritados.',
    imageUrl: 'assets/images/lagrimas.svg',
    images: ['assets/images/lagrimas.svg'],
    category: 'Cuidado Ocular',
    tags: ['lagrimas artificiales', 'lubricante ocular', 'irritacion'],
    variants: [
      { id: 'v-013-gotas', label: 'Frasco 10ml', price: 45.0, sku: 'HYA-10', stock: 50 }
    ],
    rating: 4.8, reviewCount: 1450, prescription: false,
  },
  {
    id: 'prod-014',
    name: 'Melatonina 5mg + Magnesio',
    brand: 'Nature Made',
    description: 'Suplemento natural para ayudar a regular el ciclo del sueño. Induce relajación y descanso profundo.',
    imageUrl: 'assets/images/melatonina.svg',
    images: ['assets/images/melatonina.svg'],
    category: 'Bienestar',
    tags: ['inductor del sueño', 'relajante', 'melatonina', 'insomnio', 'magnesio', 'suplemento'],
    variants: [
      { id: 'v-014-frasco', label: 'Frasco x 60 gomas', price: 65.0, sku: 'MELA-60', stock: 90 }
    ],
    rating: 4.9, reviewCount: 6700, prescription: false,
  },
  {
    id: 'prod-015',
    name: 'Crema Antipañalitis con Óxido de Zinc 40%',
    brand: 'Desitin',
    description: 'Máxima protección para rozaduras severas en bebés. Forma una barrera protectora al instante.',
    imageUrl: 'assets/images/desitin.svg',
    images: ['assets/images/desitin.svg'],
    category: 'Cuidado Infantil',
    tags: ['crema antipañalitis', 'cuidado infantil', 'dermatologia', 'oxido de zinc'],
    variants: [
      { id: 'v-015-tubo', label: 'Tubo x 113g', price: 38.0, sku: 'DES-113', stock: 140 }
    ],
    rating: 4.9, reviewCount: 9800, prescription: false,
  },
  {
    id: 'prod-016',
    name: 'Fenazopiridina 100mg',
    brand: 'Pyridium',
    description: 'Analgésico del tracto urinario. Alivia el ardor, dolor y urgencia por infecciones urinarias.',
    imageUrl: 'assets/images/fenazopiridina.svg',
    images: ['assets/images/fenazopiridina.svg'],
    category: 'Salud Íntima',
    tags: ['analgesico urinario', 'salud intima'],
    variants: [
      { id: 'v-016-caja', label: 'Caja x 24 tabletas', price: 32.5, sku: 'FENA-24', stock: 75 }
    ],
    rating: 4.6, reviewCount: 1100, prescription: true,
  }
];

// ─────────────────────────────────────────────
// SERVICE WITH FUZZY & INSENSITIVE SEARCH
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductMockService {
  /** Signal interno del catálogo completo */
  private readonly _catalog = signal<Product[]>(MOCK_PRODUCTS);

  /** Catálogo público (read-only) */
  readonly catalog = this._catalog.asReadonly();

  /**
   * Retorna todos los productos con un delay simulado de red.
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
   * BÚSQUEDA SEMÁNTICA + LÉXICA AVANZADA (Fuzzy Matching)
   */
  search(rawQuery: string): Observable<Product[]> {
    const cleanQuery = this._normalize(rawQuery);

    if (!cleanQuery) return of([]);

    // 1. Intentar resolución semántica tolerante a fallos y acentos
    const resolvedTags = this._resolveSemanticTags(cleanQuery);

    let results: Product[];

    if (resolvedTags.length > 0) {
      // 2a. Búsqueda por tags semánticos mapeados
      results = MOCK_PRODUCTS.filter((p) =>
        p.tags.some((tag) => resolvedTags.includes(this._normalize(tag)))
      );
    } else {
      // 2b. Fallback léxico: Búsqueda por similitud de palabras en Nombre, Marca o Descripción
      const queryTokens = cleanQuery.split(/\s+/);

      results = MOCK_PRODUCTS.filter((p) => {
        const normalizedName = this._normalize(p.name);
        const normalizedBrand = this._normalize(p.brand);
        const normalizedDesc = this._normalize(p.description);

        // Si la query está contenida textualmente de forma exacta
        if (normalizedName.includes(cleanQuery) || normalizedBrand.includes(cleanQuery) || normalizedDesc.includes(cleanQuery)) {
          return true;
        }

        // Si no, evaluar similitud de tokens (útil para detectar palabras mal escritas en el catálogo)
        const nameTokens = normalizedName.split(/\s+/);
        return queryTokens.some(qToken =>
          nameTokens.some(nToken => this._isSimilar(qToken, nToken)) ||
          p.tags.some(tag => this._isSimilar(qToken, this._normalize(tag)))
        );
      });
    }

    return of(results).pipe(delay(200));
  }

  /**
   * Resuelve una query a tags de síntomas usando lógica difusa (Fuzzy Match)
   */
  private _resolveSemanticTags(cleanQuery: string): string[] {
    // Escenario A: Intento de match por inclusión directa (ej: "tengo fiebre alta" incluye "fiebre")
    for (const [symptom, tags] of Object.entries(SEMANTIC_MAP)) {
      const normalizedSymptom = this._normalize(symptom);
      if (cleanQuery.includes(normalizedSymptom) || normalizedSymptom.includes(cleanQuery)) {
        return tags;
      }
    }

    // Escenario B: Tokenización + Algoritmo Levenshtein (ej: "febra" -> similar a "fiebre")
    const queryTokens = cleanQuery.split(/\s+/).filter(token => token.length > 2); // ignora conectores de 1 o 2 letras

    for (const [symptom, tags] of Object.entries(SEMANTIC_MAP)) {
      const symptomTokens = this._normalize(symptom).split(/\s+/);

      for (const qToken of queryTokens) {
        for (const sToken of symptomTokens) {
          if (this._isSimilar(qToken, sToken)) {
            return tags; // Retorna el match al primer síntoma semánticamente similar hallado
          }
        }
      }
    }

    return [];
  }

  /**
   * Helper: Normaliza el texto removiendo mayúsculas, tildes, diacríticos y espacios extra.
   */
  private _normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remueve acentos/tildes mediante Regex
      .trim();
  }

  /**
   * Determina si dos palabras son similares basándose en su distancia de Levenshtein.
   */
  private _isSimilar(word1: string, word2: string): boolean {
    if (word1 === word2) return true;

    const distance = this._levenshteinDistance(word1, word2);

    // Umbral dinámico adaptativo según el largo de la palabra
    // Si la palabra es muy corta (<= 4 letras, ej: "tos"), exigimos máxima precisión (máx 1 error).
    // Si es larga (ej: "estreñimiento"), toleramos hasta 2 tipografías erróneas.
    const maxAllowedErrors = word2.length > 4 ? 2 : 1;

    return distance <= maxAllowedErrors;
  }

  /**
   * Algoritmo de Distancia de Levenshtein (Cálculo de diferencia de caracteres)
   */
  private _levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Sustitución
            matrix[i][j - 1] + 1,     // Inserción
            matrix[i - 1][j] + 1      // Eliminación
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  getByCategory(category: string): Observable<Product[]> {
    return of(MOCK_PRODUCTS.filter((p) => p.category === category)).pipe(delay(250));
  }

  getCrossSelling(ids: string[]): Observable<Product[]> {
    return of(MOCK_PRODUCTS.filter((p) => ids.includes(p.id))).pipe(delay(200));
  }
}
