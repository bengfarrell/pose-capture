import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PlaybackEvent } from '../playbackevent';
import { LOOP } from "./icons";
import './play-button';
import './toggle-button';
import './timeline';
import {Timeline} from "./timeline";

@customElement('pose-playback-controls')
export class PlaybackControls extends LitElement {

    @property({ type: Number, reflect: true }) currentTime: number = 0;

    @property({ type: Number, reflect: true }) duration: number = 0;

    @property({ type: Boolean, reflect: true }) isPlaying: boolean = false;

    @property({ type: Boolean, reflect: true }) isLooping: boolean = false;

    static styles = css`
        :host {
          background-color: #5f6773;
          height: 25px;
          display: flex;
          align-items: center;
          font-family: 'Open Sans', arial, sans-serif;
          color: white;
          font-size: small;
          bottom: 0;
        }
      
        span {
          filter: drop-shadow(1px 3px .5px rgb(50, 55, 58));
        }
      
        .divider {
          height: 66%;
          width: 1px;
          background-color: #8292a2;
          margin-left: 5px;
          margin-right: 5px;
        }
      
        .control {
          height: 100%;
        }
      
        pose-timeline {
          width: 200px;
          height: 100%;
        }
    `;

    protected doAction(action: string) {
        const e: PlaybackEvent = new PlaybackEvent(
            action,
            this,
            { bubbles: true, composed: true });
        this.dispatchEvent(e);
    }

    public render() {
        return html`<pose-play-button 
                        class="control" 
                        ?playing=${this.isPlaying}
                        @click=${() => this.doAction(PlaybackEvent.TOGGLE_PLAYBACK)}>
                    </pose-play-button>
                    <div class="divider"></div>
                    <pose-timeline 
                        class="control" 
                        @scrub=${(e: Event) => {
                            this.currentTime = ((e.target as Timeline).scrubProgress / 100) * this.duration;
                            this.doAction(PlaybackEvent.TIMELINE_SCRUB);
                        }}
                        progress=${(this.currentTime / this.duration) * 100}>
                    </pose-timeline>
                    <div class="divider"></div>
                    <span>${PlaybackControls.formatTime(this.currentTime)} / ${PlaybackControls.formatTime(this.duration)}</span>
                    <div class="divider"></div>
                    <pose-toggle-button 
                        class="control"
                        @click=${() => this.doAction(PlaybackEvent.LOOP)}
                        ?active=${this.isLooping}>
                        ${LOOP}
                    </pose-toggle-button>`;
    }

    public static formatTime(ms: number | undefined) {
        if (ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            return `${minutes.toString().length === 2 ? minutes.toString() : '0' + minutes.toString()}:${(seconds % 60).toString().length === 2 ? (seconds % 60).toString() : '0' + (seconds % 60).toString()}`;
        } else {
            return '00:00';
        }
    }
}
