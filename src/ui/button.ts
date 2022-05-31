import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pose-button')
export class Button extends LitElement {
    @property({ type: Boolean, reflect: true }) disabled: boolean = false;

    static styles = [ css`
      :host {
        display: inline-block;
        padding-left: 3px;
        padding-right: 3px;
      }
      
      :host([disabled]) {
        pointer-events: none;
      }

      :host([disabled]) button {
        opacity: .25;
      }

      button {
        display: inline-block;
        background-color: transparent;
        border: none;
        color: white;
        padding: 5px;
        height: 100%;
      }

      button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      button svg,
      button ::slotted(svg) {
        width: 18px;
        height: 18px;
        fill: white;
        vertical-align: middle;
        filter: drop-shadow(1px 3px .5px rgb(50, 55, 58));
      }

      button:hover svg,
      button:hover ::slotted(svg) {
        margin-top: 1px;
        filter: drop-shadow(1px 1px .5px rgb(44, 39, 39));
      }
    `];

    public render() {
        return html`<button><slot></slot></button>`;
    }
}
