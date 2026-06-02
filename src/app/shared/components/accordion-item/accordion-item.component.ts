import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Accessible accordion item built on native `<details>` / `<summary>` semantics.
 *
 * @description
 * Uses browser-native disclosure elements to avoid custom ARIA role management:
 * - `<details>` provides the expand/collapse state machine natively.
 * - `<summary>` is inherently keyboard-accessible (Enter / Space) and announces
 *   expanded state to assistive technologies via the `open` DOM property.
 * - No JavaScript is required for the toggle behaviour.
 *
 * **SSR safety:** the `[open]` property binding serialises to the `open`
 * HTML attribute in server-generated markup, so the initial open/closed state
 * is correct before hydration.
 *
 * **Animation:** the chevron icon rotates 180° via a CSS sibling selector on
 * `details[open]` — zero JS and SSR-safe.
 *
 * @example
 * ```html
 * <app-accordion-item itemId="desc" title="Descripción">
 *   <p>Content projected here.</p>
 * </app-accordion-item>
 * ```
 */
@Component({
  selector: 'app-accordion-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details
      class="accordion"
      [open]="defaultOpen"
      [id]="'accordion-' + itemId"
    >
      <!--
        <summary> is the interactive affordance. Screen readers announce the
        accessible name (title text) and the expanded/collapsed state automatically
        via the native disclosure role — no aria-expanded needed.
      -->
      <summary
        class="accordion__head"
        [attr.aria-controls]="'accordion-body-' + itemId"
      >
        <span class="accordion__label">{{ title }}</span>
        <span class="accordion__icon" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2.5 5L7 9.5L11.5 5"
              stroke="#354159"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
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
      /* Remove native <summary> marker across all browsers */
      list-style: none;
      user-select: none;

      &::-webkit-details-marker { display: none; }

      /* WCAG 2.4.7: keyboard focus ring */
      &:focus-visible {
        outline: 2px solid #1A8FF1;
        outline-offset: -2px;
      }

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
  /**
   * Unique identifier used to construct the `id` attributes of both the
   * `<details>` element and its body `<div>`.
   * Must be unique within the page to ensure correct `aria-controls` linkage.
   */
  @Input({ required: true }) itemId!: string;

  /** Text label rendered inside `<summary>` as the accordion trigger. */
  @Input({ required: true }) title!: string;

  /**
   * Whether the accordion is expanded on initial render.
   * Serialised to the native `open` attribute in SSR-generated HTML.
   * Defaults to `false` (collapsed).
   */
  @Input() defaultOpen = false;
}
