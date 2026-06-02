import { Component, inject, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Modal backdrop -->
    <div class="cart-modal-backdrop" (click)="closeModal()"></div>

    <!-- Modal content -->
    <div class="cart-modal">
      <!-- Header -->
      <div class="cart-modal__header">
        <h2 class="cart-modal__title">Mi Carrito</h2>
        <button
          class="cart-modal__close"
          (click)="closeModal()"
          aria-label="Cerrar modal"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="cart-modal__content">
        @if (items.length > 0) {
          <div class="cart-modal__items">
            @for (item of items; track item.product.id) {
              <div class="cart-modal__item">
                <div class="cart-modal__item-info">
                  <h3 class="cart-modal__item-name">{{ item.product.name }}</h3>
                  <p class="cart-modal__item-brand">{{ item.product.brand }}</p>
                  <p class="cart-modal__item-variant">{{ item.variant.label }}</p>
                </div>
                <div class="cart-modal__item-price">
                  <span class="cart-modal__item-quantity">x{{ item.quantity }}</span>
                  <span class="cart-modal__item-total">
                    S/. {{ (item.variant.price * item.quantity).toFixed(2) }}
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Total -->
          <div class="cart-modal__total">
            <span class="cart-modal__total-label">Total:</span>
            <span class="cart-modal__total-amount">S/. {{ getTotal().toFixed(2) }}</span>
          </div>

          <!-- Buttons -->
          <div class="cart-modal__actions">
            <button
              class="cart-modal__btn cart-modal__btn--secondary"
              (click)="closeModal()"
            >
              Seguir comprando
            </button>
            <a
              routerLink="/compra-exitosa"
              class="cart-modal__btn cart-modal__btn--primary"
              (click)="onCheckout()"
            >
              Comprar
            </a>
          </div>
        } @else {
          <div class="cart-modal__empty">
            <p>Tu carrito está vacío</p>
            <p class="cart-modal__empty-hint">Agrega productos para empezar a comprar</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .cart-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 200ms ease;
    }

    .cart-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideUp 300ms ease;
      overflow: hidden;
    }

    .cart-modal__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #F0F2F6;
      background: #f8f9fa;
    }

    .cart-modal__title {
      margin: 0;
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1B8F43;
    }

    .cart-modal__close {
      background: none;
      border: none;
      font-size: 24px;
      color: #354159;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 150ms ease;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }

    .cart-modal__content {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .cart-modal__items {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .cart-modal__item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #E5E8ED;
    }

    .cart-modal__item-info {
      flex: 1;
    }

    .cart-modal__item-name {
      margin: 0 0 4px 0;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1B8F43;
    }

    .cart-modal__item-brand {
      margin: 0 0 2px 0;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #7E8BA7;
    }

    .cart-modal__item-variant {
      margin: 0;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #354159;
    }

    .cart-modal__item-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      min-width: 80px;
    }

    .cart-modal__item-quantity {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #7E8BA7;
    }

    .cart-modal__item-total {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1B8F43;
    }

    .cart-modal__total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f0f7f2;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #D4EFE0;
    }

    .cart-modal__total-label {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #354159;
    }

    .cart-modal__total-amount {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #1B8F43;
    }

    .cart-modal__empty {
      text-align: center;
      padding: 40px 20px;
    }

    .cart-modal__empty > p {
      margin: 0 0 8px 0;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #354159;
    }

    .cart-modal__empty-hint {
      color: #7E8BA7;
      font-size: 12px;
    }

    .cart-modal__actions {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #F0F2F6;
      background: #f8f9fa;
    }

    .cart-modal__btn {
      flex: 1;
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms ease;

      &--primary {
        background: #1B8F43;
        color: #ffffff;

        &:hover {
          background: #158f3a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(27, 143, 67, 0.3);
        }
      }

      &--secondary {
        background: #ffffff;
        color: #1B8F43;
        border: 2px solid #1B8F43;

        &:hover {
          background: #f0f7f2;
        }
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translate(-50%, -40%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%);
        opacity: 1;
      }
    }
  `]
})
export class CartModalComponent {
  @Output() closeRequest = new EventEmitter<void>();

  cartService = inject(CartService);

  get items(): ReadonlyArray<CartItem> {
    return this.cartService.items();
  }

  getTotal(): number {
    return this.items.reduce((total, item) => {
      return total + (item.variant.price * item.quantity);
    }, 0);
  }

  closeModal(): void {
    this.closeRequest.emit();
  }

  onCheckout(): void {
    this.cartService.clearCart();
    this.closeModal();
  }
}
