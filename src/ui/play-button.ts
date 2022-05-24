import { html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { Play, Pause } from "./icons";
import { Button } from "./button";

@customElement('pose-play-button')
export class PlayButton extends Button {
    @property({ type: Boolean, reflect: true }) playing: boolean = false;

    static styles = [ ...Button.styles ];

    public render() {
        return html`<button>${this.playing ? Pause : Play}</button>`;
    }
}
