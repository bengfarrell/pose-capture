import { html, css, LitElement, svg } from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import '../poseplayer';
// import '../facelandmark-video';
import '../bodypix-video';
import '../handpose-video';
import '../visualization-canvas';
import '../ui/playbackcontrols';
import {PoseRecording, VideoPoseBase} from "../videopose-element";
import '../video-element';
import {BasePlayer} from "../baseplayer";
import {Events} from "../events";
import PosePlayer from "../poseplayer";


// Download by jenya from NounProject.com
const download_icon = svg`
<svg width="700pt" height="700pt" version="1.1" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg">
 <path d="m251.04 513.33h197.93c18.785 0 34.285 0 46.91-1.0312 13.117-1.0703 25.172-3.3711 36.496-9.1406 17.562-8.9492 31.84-23.227 40.785-40.785 5.7695-11.324 8.0703-23.383 9.1406-36.496 1.0312-12.629 1.0312-28.129 1.0312-46.91v-28.965c0-12.887-10.445-23.332-23.332-23.332-12.887 0-23.332 10.445-23.332 23.332v28c0 19.988-0.019531 33.574-0.87891 44.078-0.83594 10.23-2.3516 15.461-4.2109 19.109-4.4727 8.7812-11.613 15.922-20.395 20.395-3.6484 1.8594-8.8789 3.375-19.109 4.2109-10.504 0.85938-24.09 0.87891-44.078 0.87891h-196c-19.988 0-33.574-0.019531-44.074-0.87891-10.23-0.83594-15.461-2.3516-19.109-4.2109-8.7812-4.4727-15.922-11.613-20.395-20.395-1.8594-3.6484-3.375-8.8789-4.2109-19.109-0.85938-10.504-0.875-24.09-0.875-44.078v-28c0-12.887-10.445-23.332-23.332-23.332-12.887 0-23.332 10.445-23.332 23.332v28.965c0 18.785 0 34.285 1.0312 46.91 1.0703 13.117 3.3711 25.172 9.1406 36.496 8.9492 17.562 23.227 31.84 40.789 40.785 11.324 5.7695 23.383 8.0703 36.496 9.1406 12.629 1.0312 28.129 1.0312 46.914 1.0312zm82.465-146.84c9.1133 9.1133 23.887 9.1133 32.996 0l116.67-116.67c9.1133-9.1133 9.1133-23.887 0-33-9.1133-9.1133-23.887-9.1133-32.996 0l-76.836 76.836v-223.67c0-12.887-10.445-23.332-23.332-23.332s-23.332 10.445-23.332 23.332v223.67l-76.836-76.836c-9.1133-9.1133-23.887-9.1133-33 0s-9.1133 23.887 0 33z" fill-rule="evenodd"/>
</svg>`;

interface Recording extends PoseRecording {
    name: string;
    timestamp: number;
}

@customElement('pose-demo-app')
export class DemoApp extends LitElement {
    static styles = css`
      :host {
        width: 100%;
        height: 100%;
        display: inline-block;
        background: #cccccc;
        font-family: 'Open Sans', arial, sans-serif;
      }
      
      .recording-btn {
        width: 100%;
        display: flex;
      }

      .recording-btn .load {
        flex: 1;
      }

      .recording-btn .download svg {
        margin: 10px;
        width: 25px;
        height: 25px;
        padding-left: 0;
        padding-right: 0;
      }

      #player {
        width: 100%;
        height: 100%;
        display: inline-block;
        background-color: #333333;
      }

      #main {
        width: 100%;
        height: calc(100% - 57px);
        display: flex;
      }

      #recordings-container {
        width: 200px;
        display: flex;
        flex-direction: column;
        padding: 10px;
        background-color: #aaaaaa;
        border-right-color: #7e7e7e;
        border-right-width: 1px;
        border-right-style: solid;
      }

      #recordings-container button {
        border: none;
        padding: 5px;
        margin: 5px;
      }

      header {
        padding: 10px;
        background-color: #aaaaaa;
        border-bottom-color: #7e7e7e;
        border-bottom-width: 1px;
        border-bottom-style: solid;
        height: 37px;
      }

      header button {
        border: none;
        padding: 10px;
      }

      button:hover,
      button[selected] {
        background-color: #97a6b6;
        color: white;
      }`;

    @state()
    selected?: string;

    recordings: Recording[] = [{
        keyframes: [],
        duration: 1999,
        timestamp: Date.now(),
        name: 'hi'
    }];

    pendingRecording?: Recording;

    @query('#player')
    player?: PosePlayer | VideoPoseBase



    constructor() {
        super();
        this.addEventListener(Events.READY, () => {
            if (this.selected === 'pose' && this.player && this.pendingRecording) {
                (this.player as PosePlayer).recording = this.pendingRecording;
            }
        })
    }

    protected onRecordingFinished(e: Event) {
        const recording: PoseRecording = (e.target as VideoPoseBase).recording;
        this.recordings.push({
            name: this.selected as string,
            timestamp: Date.now(),
            keyframes: recording.keyframes,
            duration: recording.duration

        });
        this.requestUpdate('recordings');
        /* const link = document.createElement('a');
        const data = `data:text/json;charset=utf-8,${
            encodeURIComponent( JSON.stringify(
                (e.target as VideoPoseBase).recording)
            )}`;
        link.setAttribute('download', 'posedata.json');
        link.setAttribute('href', data);
        link.click(); */
    }

    select(player: string) {
        this.selected = player;
    }

    loadRecording(recording: Recording) {
        this.pendingRecording = recording;
        this.selected = 'pose';
    }

    public XXXrender() {
        return html`
            <bodypix-video
                id="video" xcamera source="./sampleassets/conan.mp4"
                @endrecording=${this.onRecordingFinished}>
            <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
            <pose-playback-controls></pose-playback-controls>
        </bodypix-video>`;
    }

    render() {
        return html`<header>
            <button ?selected=${this.selected === 'body'} @click=${() => this.select('body')}>Body</button>
            <button ?selected=${this.selected === 'hands'} @click=${() => this.select('hands')}>Hands</button>
            <button ?selected=${this.selected === 'face'} @click=${() => this.select('face')}>Face</button>
        </header>
        <div id="main">
            <div id="recordings-container">
                <h3>Recordings</h3>
                ${this.recordings.map((recording: Recording) => {
                    return html`<div class="recording-btn"><button class="load" @click=${() => { this.loadRecording(recording)}}>
                        ${recording.name} - ${BasePlayer.formatTime(recording.duration)}
                        <br />
                        ${new Date(recording.timestamp).toLocaleTimeString()}
                    </button><button class="download">${download_icon}</button></div>`;
                })}
            </div>
            ${this.renderPlayer()}
        </div>`;
    }

    renderPlayer() {
        switch (this.selected) {
            case 'body':
                return html`
                    <bodypix-video id="player" camera @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </bodypix-video>`;
                break;

            case 'hands':
                return html`
                    <handpose-video id="player" camera @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </handpose-video>`;
                break;

            case 'pose':
                return html`<pose-player id="player" autoplay islooping>
                    <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                    <pose-playback-controls></pose-playback-controls>
                </pose-player>`;


            default:
                return undefined;
        }
    }


    renderPoseVideo() {
        return html`<pose-player id="video" autoplay islooping posedata="./sampleassets/posedata.json">
            <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
            <pose-playback-controls></pose-playback-controls>
        </pose-player>`;
    }
}
