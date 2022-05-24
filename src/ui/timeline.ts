import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pose-timeline')
export class Timeline extends LitElement {
    @property({ type: Number, reflect: true }) progress: number = 0;
    @property({ type: Number, reflect: true }) scrubProgress: number = -1;

    static styles = css`
      :host {
        position: relative;
        display: inline-block;
      }

      #container {
        background-color: #5f6773;
        width: 100%;
        height: 100%;
        position: absolute;
      }

      #progress {
        position: absolute;
        height: 100%;
        background-color: #66b2ea;
      }
    `;

    protected handlePointerMove = (e:PointerEvent) => {
        this.calculateScrubPos(e.clientX);
        this.requestUpdate();
    }

    protected handlePointerUp = () => {
        document.removeEventListener('pointermove', this.handlePointerMove as any);
        document.removeEventListener('pointerup', this.handlePointerUp as any);
        this.scrubProgress = -1;
        this.requestUpdate();
    }

    protected handlePointerDown(e:PointerEvent) {
        document.addEventListener('pointermove', this.handlePointerMove as any);
        document.addEventListener('pointerup', this.handlePointerUp as any);
        this.calculateScrubPos(e.clientX);
        this.requestUpdate();
    }

    protected calculateScrubPos(x: number) {
        const bounds = this.getBoundingClientRect();
        const relativeX = x - bounds.x;
        this.scrubProgress = Math.min(Math.max((relativeX / this.getBoundingClientRect().width) * 100, 0), 100);
        const event = new Event('scrub', { bubbles: true });
        this.dispatchEvent(event);
    }

    public render() {
        return html`<div id="container">
            <div id="progress" 
                 @pointerdown=${this.handlePointerDown}
                 style="width: ${this.scrubProgress >= 0 ? this.scrubProgress : this.progress}%">
            </div>
        </div>`;
    }
}
