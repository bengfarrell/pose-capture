import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('pose-button')
export class Button extends LitElement {
    static styles = [ css`
      :host {
        display: inline-block;
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
        background-color: rgba(0, 0, 0, 0.25);
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
