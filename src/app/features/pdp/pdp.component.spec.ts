/**
 * TEST CRÍTICO: Selector de Variantes → Precio en UI
 *
 * Verifica que al seleccionar una variante diferente (Caja vs Sobre),
 * el precio mostrado en la UI se actualiza correctamente.
 *
 * Framework: Jest + @testing-library/angular
 *
 * ¿Por qué este test es crítico?
 * El selector de variantes es el componente de mayor impacto en conversión.
 * Un bug aquí (mostrar precio incorrecto) genera pérdida de confianza
 * del usuario y posibles disputas de pago.
 */

import { ComponentFixture } from '@angular/core/testing';
import { render, screen, fireEvent, within } from '@testing-library/angular';
import { signal } from '@angular/core';

import { PdpComponent } from './pdp.component';
import { ProductMockService, Product, ProductVariant } from '../../core/services/product-mock.service';
import { CartService } from '../../core/services/cart.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_VARIANT_CAJA: ProductVariant = {
  id: 'v-001-caja',
  label: 'Caja x 10 tabletas',
  price: 12.5,
  originalPrice: 15.0,
  sku: 'PHARM-AG-CJ10',
  stock: 50,
};

const MOCK_VARIANT_SOBRE: ProductVariant = {
  id: 'v-001-sobre',
  label: 'Sobre x 1 tableta',
  price: 1.8,
  sku: 'PHARM-AG-SB1',
  stock: 200,
};

const MOCK_PRODUCT: Product = {
  id: 'prod-001',
  name: 'Pharamol Antigripal',
  brand: 'Pharamol',
  description: 'Descripción de prueba.',
  imageUrl: 'assets/test.webp',
  images: ['assets/test.webp'],
  category: 'Antigripales',
  tags: ['antigripal'],
  variants: [MOCK_VARIANT_CAJA, MOCK_VARIANT_SOBRE],
  rating: 4.7,
  reviewCount: 100,
  prescription: false,
};

// ─── MOCKS DE SERVICIOS ───────────────────────────────────────────────────────
const mockProductService: Partial<ProductMockService> = {
  getById: jest.fn().mockReturnValue(of(MOCK_PRODUCT)),
  getCrossSelling: jest.fn().mockReturnValue(of([])),
};

const mockCartService: Partial<CartService> = {
  addItem: jest.fn(),
  status: signal('idle') as any,
  errorMessage: signal(null) as any,
  clearError: jest.fn(),
};

const mockAnalyticsService: Partial<AnalyticsService> = {
  trackViewItem: jest.fn(),
  trackAddToCart: jest.fn(),
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function renderPdp() {
  return render(PdpComponent, {
    componentProperties: { id: 'prod-001' },
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideAnimations(),
      { provide: ProductMockService, useValue: mockProductService },
      { provide: CartService,        useValue: mockCartService },
      { provide: AnalyticsService,   useValue: mockAnalyticsService },
    ],
  });
}

// ─── SUITE DE TESTS ───────────────────────────────────────────────────────────
describe('PdpComponent — Selector de Variantes', () => {

  describe('Estado Inicial', () => {
    it('debe mostrar el precio de la primera variante (Caja x 10) por defecto', async () => {
      await renderPdp();

      // Busca el elemento de precio (aria-label o texto)
      const priceEl = screen.getByText(/S\/\s*12[,.]50/i);
      expect(priceEl).toBeInTheDocument();
    });

    it('debe mostrar el botón de la variante Caja como seleccionado (aria-pressed=true)', async () => {
      await renderPdp();

      const cajaBtn = screen.getByRole('button', { name: /Caja x 10 tabletas/i });
      expect(cajaBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('debe mostrar el precio tachado original de la variante Caja', async () => {
      await renderPdp();

      // El precio tachado S/ 15.00 debe existir como elemento <s>
      const strikeEl = screen.getByText(/S\/\s*15[,.]00/i);
      expect(strikeEl.tagName.toLowerCase()).toBe('s');
    });
  });

  describe('Al seleccionar la variante "Sobre x 1 tableta"', () => {
    it('debe actualizar el precio a S/ 1.80', async () => {
      await renderPdp();

      // 1. Encuentra y hace click en el botón de la variante Sobre
      const sobreBtn = screen.getByRole('button', { name: /Sobre x 1 tableta/i });
      fireEvent.click(sobreBtn);

      // 2. El precio debe actualizarse en la UI
      const newPriceEl = await screen.findByText(/S\/\s*1[,.]80/i);
      expect(newPriceEl).toBeInTheDocument();
    });

    it('debe marcar el botón "Sobre x 1" como seleccionado (aria-pressed=true)', async () => {
      await renderPdp();

      const sobreBtn = screen.getByRole('button', { name: /Sobre x 1 tableta/i });
      fireEvent.click(sobreBtn);

      expect(sobreBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('debe desmarcar el botón "Caja x 10" como no seleccionado (aria-pressed=false)', async () => {
      await renderPdp();

      const sobreBtn = screen.getByRole('button', { name: /Sobre x 1 tableta/i });
      const cajaBtn  = screen.getByRole('button', { name: /Caja x 10 tabletas/i });

      fireEvent.click(sobreBtn);

      expect(cajaBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('NO debe mostrar el precio tachado (el Sobre no tiene descuento)', async () => {
      await renderPdp();

      const sobreBtn = screen.getByRole('button', { name: /Sobre x 1 tableta/i });
      fireEvent.click(sobreBtn);

      // El precio S/ 15.00 (precio original de Caja) no debe estar en el DOM
      expect(screen.queryByText(/S\/\s*15[,.]00/i)).not.toBeInTheDocument();
    });
  });

  describe('Accesibilidad del Selector de Variantes', () => {
    it('el grupo de variantes debe tener un label descriptivo', async () => {
      await renderPdp();

      // El grupo role="group" debe ser reconocido
      const group = screen.getByRole('group', { name: /Presentación/i });
      expect(group).toBeInTheDocument();
    });

    it('cada botón de variante debe tener aria-label con precio', async () => {
      await renderPdp();

      const cajaBtn = screen.getByLabelText(/Caja x 10 tabletas — S\/ 12.5/i);
      expect(cajaBtn).toBeInTheDocument();
    });
  });

  describe('Optimistic UI — CartService', () => {
    it('debe llamar a cartService.addItem al hacer click en "Agregar al carrito"', async () => {
      await renderPdp();

      const addBtn = screen.getByRole('button', { name: /Agregar al carrito/i });
      fireEvent.click(addBtn);

      expect(mockCartService.addItem).toHaveBeenCalledWith(
        MOCK_PRODUCT,
        MOCK_VARIANT_CAJA,
        1
      );
    });

    it('debe llamar a cartService.addItem con la variante seleccionada al cambiar', async () => {
      await renderPdp();

      // Seleccionar Sobre
      const sobreBtn = screen.getByRole('button', { name: /Sobre x 1 tableta/i });
      fireEvent.click(sobreBtn);

      // Agregar al carrito
      const addBtn = screen.getByRole('button', { name: /Agregar al carrito/i });
      fireEvent.click(addBtn);

      expect(mockCartService.addItem).toHaveBeenCalledWith(
        MOCK_PRODUCT,
        MOCK_VARIANT_SOBRE,
        1
      );
    });
  });

});
