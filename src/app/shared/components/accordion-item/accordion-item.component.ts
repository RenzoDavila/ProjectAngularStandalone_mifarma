import {
  Component,
  Input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * AccordionItemComponent — Standalone
 *
 * Acordeón accesible usando <details>/<summary> nativos.
 * - Sin JavaScript extra: el browser maneja el toggle
 * - SSR-safe: el estado open/closed se renderiza en el HTML del servidor
 * - Animación de chevron con CSS puro (transform rotate)
 */
@Component({
  selector: 'app-accordion-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="accordion" [open]="defaultOpen" [id]="'accordion-' + itemId">
      <summary class="accordion__head" [attr.aria-controls]="'accordion-body-' + itemId">
        <span class="accordion__label">{{ title }}</span>
        <span class="accordion__icon" aria-hidden="true">
          <!-- ChevronUp/Down — CSS rotate en función del estado open -->
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 5L7 9.5L11.5 5" stroke="#354159" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </summary>
      <div class="accordion__body" [id]="'accordion-body-' + itemId">
        <ng-content />
      </div>
    </details>
  `,
  styles: [`
    .accordion {
      border-bottom: 1px solid #F0F2F6;
      background: #ffffff;

      /* Anima la apertura del body en browsers con soporte */
      &[open] .accordion__icon svg {
        transform: rotate(180deg);
      }
    }

    .accordion__head {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 12px 24px;
      gap: 8px;
      height: 56px;
      cursor: pointer;
      list-style: none; /* elimina el marker nativo de <summary> */
      user-select: none;

      /* Elimina el marker de Safari */
      &::-webkit-details-marker { display: none; }

      &:hover .accordion__label {
        color: #1A8FF1;
      }
    }

    .accordion__label {
      flex: 1;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: 0.1px;
      color: #354159;
      transition: color 150ms ease;
    }

    .accordion__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      flex-shrink: 0;
      transition: background 150ms ease;

      svg {
        transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    .accordion__body {
      padding: 0 24px 24px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      line-height: 20px;
      letter-spacing: 0.1px;
      color: #7E8BA7;
    }
  `],
})
export class AccordionItemComponent {
  @Input({ required: true }) itemId!: string;
  @Input({ required: true }) title!: string;
  @Input() defaultOpen = false;
}
