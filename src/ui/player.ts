import { css, html, LitElement } from 'lit';
import { customElement, query, property } from 'lit/decorators.js';
import { PlaybackEvent } from '../playbackevent';
import PosePlayer from '../poseplayer';
import { VideoPoseBase } from '../videopose-element';

@customElement('pose-player-shell')
export class PlayerShell extends LitElement {
    @query('#player')
    protected player?: PosePlayer | VideoPoseBase;

    @property({ type: Number, reflect: true })
    public currentTime: number = 0;

    @property({ type: Number, reflect: true })
    public duration: number = 0;

    @property({ type: Boolean, reflect: true })
    public isLooping: boolean = false;

    private _isPlaying: boolean = false;

    @property({ type: Boolean, reflect: true })
    public set isPlaying(val: boolean) {
        const oldVal = this._isPlaying;
        this._isPlaying = val;

        if (this._isPlaying) {
            this.player?.play();
        } else {
            this.player?.pause();
        }
        this.requestUpdate('isPlaying', oldVal);
    }

    public get isPlaying(): boolean {
        return this._isPlaying;
    }

    static styles = css`
      :host {
        display: inline-block;
        width: 640px;
        height: 505px;
      }

      pose-player {
        width: 100%;
        background-color: #505050;
        height: calc(100% - 25px);
      }
    `;

    protected handlePlaybackControlEvent(event: PlaybackEvent) {
        switch (event.action) {
            case PlaybackEvent.TOGGLE_PLAYBACK:
                this.isPlaying = event.state?.isPlaying as boolean;
                break;

            case PlaybackEvent.PLAYBACK_TIME_UPDATE:
                this.currentTime = event.state?.currentTime as number;
                this.duration = event.state?.duration as number;
                break;

            case PlaybackEvent.LOOP:
                this.isLooping = event.state?.isLooping as boolean;
        }
    }

    public render() {
        return html`
            <pose-player id="player" ?loop=${this.isLooping} 
                 @playcontrolsevent=${this.handlePlaybackControlEvent}
                 posedata="./sampleassets/posedata.json">
                <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
            </pose-player>
            <pose-playback-controls
                ?isLooping=${this.isLooping}
                ?isPlaying=${this.isPlaying} 
                currentTime=${this.currentTime}
                duration=${this.duration}
                @playcontrolsevent=${this.handlePlaybackControlEvent}>
            </pose-playback-controls>`;
    }
}
