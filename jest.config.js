// ─── JEST CONFIGURATION ──────────────────────────────────────────────────────
/** @type {import('jest').Config} */
module.exports = {
  // Usa jest-preset-angular para transpilar TypeScript y configurar el entorno de Angular
  preset: 'jest-preset-angular',

  // Entorno de browser simulado (jsdom)
  testEnvironment: 'jsdom',

  // Setup: importa los matchers de Testing Library (@testing-library/jest-dom)
  // y el setup de jest-preset-angular (zona.js, reflect-metadata, etc.)
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  // Patrón de archivos de test
  testMatch: ['**/*.spec.ts'],

  // Transforma TypeScript con ts-jest (configurado por jest-preset-angular)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },

  // Módulos que NO se transforman (de node_modules)
  // Excepción: paquetes ESM de Angular que necesitan ser transformados
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ngrx|rxjs|tslib|zone.js))',
  ],

  // Mapeo de módulos para assets y estilos (evitan errores en tests)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Evitar errores de SCSS imports en tests
    '\\.scss$': 'jest-preset-angular/build/serializers/no-ng-attributes',
  },

  // Reportero con información clara
  verbose: true,

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/main.server.ts',
    '!src/server.ts',
    '!src/**/*.spec.ts',
  ],

  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
