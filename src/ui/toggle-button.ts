import { html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { Button } from "./button";

@customElement('pose-toggle-button')
export class ToggleButton extends Button {
    @property({ type: Boolean, reflect: true }) active: boolean = false;

    static styles = [ ...Button.styles, css`
      :host([active]) button {
        background-color: rgba(0, 0, 0, 0.25);
      }
      
      :host([active]) button ::slotted(svg) {
        margin-top: 1px;
        filter: drop-shadow(1px 1px 1px rgb(50, 55, 58));
      }
    `];

    public render() {
        return html`<button><slot></slot></button>`;
    }
}
