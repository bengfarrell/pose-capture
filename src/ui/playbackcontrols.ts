import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PlaybackEvent } from '../playbackevent';
import { LOOP, RECORD, RECORD_AUDIO, STEP_FORWARD, STEP_BACK } from "./icons";
import './play-button';
import './toggle-button';
import './timeline';
import {Timeline} from "./timeline";
import {PlayerState} from "../baseplayer";

@customElement('pose-playback-controls')
export class PlaybackControls extends LitElement implements PlayerState {
    @property({ type: Number, reflect: true }) currentTime: number = 0;

    @property({ type: Number, reflect: true }) duration: number = 0;

    @property({ type: Boolean, reflect: true }) isPlaying: boolean = false;

    @property({ type: Boolean, reflect: true }) isLooping: boolean = false;

    @property({ type: Boolean, reflect: true }) isRecording: boolean = false;

    @property({ type: Boolean, reflect: true }) isAudioRecording: boolean = false;

    @property({ type: Boolean, reflect: true }) recordingDuration: number = -1;

    @property({ type: Number, reflect: true }) playbackRate: number = 1;

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

      span.time,
      span.recording-time {
        filter: drop-shadow(1px 3px .5px rgb(50, 55, 58));
        padding-left: 10px;
        padding-right: 10px;
      }

      .divider {
        height: 66%;
        width: 1px;
        background-color: #8292a2;
      }

      .control {
        height: 100%;
      }

      :host([isRecording]) span.recording-time {
        color: #ffc3c7;
      }

      .control.record[active] span,
      .control.record[active] svg {
        fill: #dd3344;
        color: #dd3344;
      }

      pose-timeline {
        flex: 1;
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
        if (this.duration === 0) {
            return this.renderLiveMode();
        } else {
            return this.renderNonLiveMode();
        }
    }

    public renderNonLiveMode() {
        return html`<pose-button ?disabled=${this.isRecording} @click=${() => this.doAction(PlaybackEvent.STEP_FORWARD)}>${STEP_FORWARD}</pose-button>
                    <div class="divider"></div>
                    <pose-play-button 
                        class="control" 
                        ?disabled=${this.isRecording}
                        ?playing=${this.isPlaying}
                        @click=${() => this.doAction(PlaybackEvent.TOGGLE_PLAYBACK)}>
                    </pose-play-button>
                    <div class="divider"></div>
                    <pose-button ?disabled=${this.isRecording} @click=${() => this.doAction(PlaybackEvent.STEP_BACKWARD)}>${STEP_BACK}</pose-button>
                    <div class="divider"></div>
                    ${this.renderRecordingControls()}
                    
                    ${!this.isRecording ? html`
                    <pose-timeline 
                        class="control"
                        @scrub=${(e: Event) => {
                            this.currentTime = ((e.target as Timeline).scrubProgress / 100) * this.duration;
                            this.doAction(PlaybackEvent.TIMELINE_SCRUB);
                        }}
                        progress=${(this.currentTime / this.duration) * 100}>
                    </pose-timeline>
                    <div class="divider"></div>
                    <span class="time">${PlaybackControls.formatTime(this.currentTime)} / ${PlaybackControls.formatTime(this.duration)}</span>
                    <div class="divider"></div>
                    <pose-toggle-button 
                        class="control"
                        @click=${() => this.doAction(PlaybackEvent.LOOP)}
                        ?active=${this.isLooping}>
                        ${LOOP}
                    </pose-toggle-button>
                    <div class="divider"></div>
                    <pose-toggle-button
                            class="control"
                            @click=${() => {
                                if (this.playbackRate === 1) {
                                    this.playbackRate = .1;
                                } else {
                                    this.playbackRate = 1;
                                }
                                this.doAction(PlaybackEvent.PLAYBACK_RATE_UPDATE);
                            }}
                            ?active=${this.playbackRate === .1}>
                        .1x
                    </pose-toggle-button>` : undefined}`;
    }

    protected renderLiveMode() {
        return this.renderRecordingControls();
    }

    protected renderRecordingControls() {
        return html`<pose-toggle-button
                class="control record"
                ?disabled=${this.isAudioRecording}
                @click=${() => this.doAction(PlaybackEvent.TOGGLE_RECORD_POSE)}
                ?active=${this.isRecording && !this.isAudioRecording}>
            ${RECORD}
        </pose-toggle-button>
        <div class="divider"></div>
        <pose-toggle-button
                class="control record"
                ?disabled=${this.isRecording && !this.isAudioRecording}
                @click=${() => this.doAction(PlaybackEvent.TOGGLE_RECORD_POSE_AND_AUDIO)}
                ?active=${this.isAudioRecording}>
            ${RECORD}<span>+</span>${RECORD_AUDIO}
        </pose-toggle-button>
        <div class="divider"></div>
        
        ${this.isRecording && this.recordingDuration > -1 ? html`
        <span class="recording-time">${PlaybackControls.formatTime(this.recordingDuration)}</span>
        <div class="divider"></div>` : undefined}`;
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
