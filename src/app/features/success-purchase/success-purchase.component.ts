import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-success-purchase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="success-container">
      <div class="success-content">
        <!-- Success checkmark -->
        <div class="success-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="60" fill="#1B8F43" opacity="0.1"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#1B8F43" stroke-width="2"/>
            <path d="M45 60L55 70L80 45" stroke="#1B8F43" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>

        <!-- Message -->
        <h1 class="success-title">¡Compra Exitosa!</h1>
        <p class="success-message">
          Tu pedido ha sido confirmado correctamente. Pronto recibirás un correo de confirmación con los detalles de tu compra y el número de seguimiento.
        </p>

        <!-- Details -->
        <div class="success-details">
          <div class="detail-item">
            <span class="detail-label">Estado del Pedido:</span>
            <span class="detail-value">Procesando</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Envío Estimado:</span>
            <span class="detail-value">3-5 días hábiles</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="success-actions">
          <a routerLink="/productos" class="success-btn success-btn--primary">
            Volver a la Farmacia
          </a>
          <a href="#" class="success-btn success-btn--secondary">
            Ver Mis Pedidos
          </a>
        </div>

        <!-- Footer message -->
        <p class="success-footer">
          Si tienes preguntas, no dudes en contactarnos al +51 XXX XXX XXX o a nuestro correo de soporte.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f0f7f2 0%, #eaf7fe 100%);
      padding: 20px;
    }

    .success-content {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(27, 143, 67, 0.1);
      padding: 60px 40px;
      max-width: 600px;
      text-align: center;
      animation: slideInUp 500ms ease;
    }

    .success-icon {
      margin-bottom: 30px;
      display: flex;
      justify-content: center;
      animation: scaleIn 600ms ease;
    }

    .success-title {
      margin: 0 0 16px 0;
      font-family: 'Inter', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #1B8F43;
      line-height: 1.2;
    }

    .success-message {
      margin: 0 0 32px 0;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      color: #354159;
      line-height: 1.6;
    }

    .success-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #E5E8ED;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
    }

    .detail-label {
      color: #7E8BA7;
      font-weight: 500;
    }

    .detail-value {
      color: #1B8F43;
      font-weight: 600;
    }

    .success-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .success-btn {
      padding: 14px 24px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 200ms ease;
      border: none;
      cursor: pointer;

      &--primary {
        background: #1B8F43;
        color: #ffffff;

        &:hover {
          background: #158f3a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(27, 143, 67, 0.3);
        }
      }

      &--secondary {
        background: #ffffff;
        color: #1B8F43;
        border: 2px solid #1B8F43;

        &:hover {
          background: #f0f7f2;
          transform: translateY(-2px);
        }
      }
    }

    .success-footer {
      margin: 0;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #7E8BA7;
      line-height: 1.5;
    }

    @keyframes slideInUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .success-content {
        padding: 40px 24px;
      }

      .success-title {
        font-size: 28px;
      }

      .success-message {
        font-size: 14px;
      }

      .success-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SuccessPurchaseComponent {}
