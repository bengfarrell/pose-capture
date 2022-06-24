import { html, css, LitElement, svg } from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import '../poseplayer';
import '../facelandmark-video';
import '../bodypix-video';
import '../handpose-video';
import '../posedetection-video';
import '../visualization-canvas';
import '../ui/playbackcontrols';
import {PoseRecording, VideoPoseBase} from "../videopose-element";
import '../video-element';
import {BasePlayer} from "../baseplayer";
import {Events} from "../events";
import PosePlayer from "../poseplayer";
import {KeyframeEvent} from "../keyframeevent";


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
      
      label {
        font-size: 10px;
      }

      #coords-log {
        font-size: 11px;
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
      
      #source-label {
        margin-left: 20px;
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

    @state()
    availableParts: string[] = [];

    sources = [
        './sampleassets/conan.mp4',
        './sampleassets/conan-face.mp4',
        './sampleassets/piano.mp4',
        'camera'
    ];

    @state()
    currentSource = this.sources[0];

    @state()
    minConfidence = 0;

    recordings: Recording[] = [];

    samples: String[] = [
        'conan-bodypix.json',
        'conan-posedetection.json',
        'conan-facelandmark.json',
        'piano.json'
    ]

    pendingRecording?: Recording;

    currentPoseFile?: String;

    @query('#player')
    player?: PosePlayer | VideoPoseBase

    @query('#parts-list')
    partsList?: HTMLInputElement;

    @query('#coords-log')
    coordsLog?: HTMLSpanElement;

    constructor() {
        super();
        this.addEventListener(Events.READY, () => {
            if (this.selected === 'pose' && this.player && this.pendingRecording) {
                (this.player as PosePlayer).recording = this.pendingRecording;
            } else {
                this.availableParts = (this.player as VideoPoseBase).parts;
            }
        });

        this.addEventListener(KeyframeEvent.EventName, ((event: KeyframeEvent) => {
            const part = this.partsList?.value;
            if (part && this.coordsLog) {
                const coords = event.getPartLocation(part)?.position || [0, 0, 0];
                this.coordsLog.innerText = `${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}, ${coords[2].toFixed(2)}`;
            }
        }) as EventListenerOrEventListenerObject);
    }

    protected onRecordingFinished(e: Event) {
        const recording: PoseRecording = (e.target as VideoPoseBase).recording;
        this.recordings.push({
            name: this.selected as string,
            timestamp: Date.now(),
            keyframes: recording.keyframes,
            duration: recording.duration,
            audio: recording.audio

        });
        this.requestUpdate('recordings');
    }

    select(player: string) {
        this.selected = player;
    }

    loadRecording(recording: Recording) {
        this.pendingRecording = recording;
        this.selected = 'pose';
    }

    loadRecordingFromFile(file: String) {
        this.currentPoseFile = `./sampleassets/${file}`;
        this.selected = 'pose';
    }

    downloadRecording(recording: Recording) {
        const link = document.createElement('a');
        const data = `data:text/json;charset=utf-8,${
            encodeURIComponent( JSON.stringify(recording)
            )}`;
        link.setAttribute('download', `${recording.name}-${recording.timestamp}.json`);
        link.setAttribute('href', data);
        link.click();
    }

    render() {
        return html`<header>
            <button ?selected=${this.selected === 'posedetection'} @click=${() => this.select('posedetection')}>PoseDetection</button>
            <button ?selected=${this.selected === 'bodypix'} @click=${() => this.select('bodypix')}>BodyPix</button>
            <button ?selected=${this.selected === 'handpose'} @click=${() => this.select('handpose')}>HandPose</button>
            <button ?selected=${this.selected === 'facelandmark'} @click=${() => this.select('facelandmark')}>Face Landmark</button>
            
            <label id="source-label">Capture pose from:</label>
            <select value=${this.currentSource} @change=${(event: InputEvent) => {
                this.currentSource = (event.target as HTMLInputElement).value;
            }}>
                ${this.sources.map((item) => {
                    return html`<option>${item}</option>`;
                })}
            </select>

            <label id="source-label">Log points for:</label>
            <select id="parts-list">
                ${this.availableParts.map((part: string) => {
                    return html`<option>${part}</option>`;
                })}
            </select>
            <span id="coords-log"></span>
        </header>
        <div id="main">
            <div id="recordings-container">
                <input type="range" min="0" max="100" @input=${(e: InputEvent) => {
                    this.minConfidence = Number((e.target as HTMLInputElement).value);
                }} value=${this.minConfidence} />
                <label>Minimum Pose Confidence ${this.minConfidence}%</label>

                <h3>Samples</h3>
                ${this.samples.map((file: String) => {
                    return html`<div class="recording-btn">
                        <button class="load" @click=${() => this.loadRecordingFromFile(file)}>
                            ${file}
                        </button>
                    </div>`;
                })}
                
                <h3>Recordings</h3>
                ${this.recordings.map((recording: Recording) => {
                    return html`<div class="recording-btn">
                        <button class="load" @click=${() => this.loadRecording(recording)}>
                            ${recording.name} - ${BasePlayer.formatTime(recording.duration)}<br />
                            ${new Date(recording.timestamp).toLocaleTimeString()}
                        </button>
                        <button class="download" @click=${() => this.downloadRecording(recording) }>${download_icon}</button>
                    </div>`;
                })}
            </div>
            ${this.renderPlayer()}
        </div>`;
    }

    renderPlayer() {
        switch (this.selected) {
            case 'bodypix':
                return html`
                    <bodypix-video 
                            id="player"
                            source=${this.currentSource}
                            ?camera=${this.currentSource === 'camera'}
                            minconfidence=${this.minConfidence} 
                            @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </bodypix-video>`;
                break;

            case 'posedetection':
                return html`
                    <posedetection-video
                            id="player" 
                            source=${this.currentSource} 
                            ?camera=${this.currentSource === 'camera'}
                            minconfidence=${this.minConfidence} 
                            @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </posedetection-video>`;
                break;

            case 'facelandmark':
                return html`
                    <facelandmark-video
                            id="player"
                            source=${this.currentSource}
                            ?camera=${this.currentSource === 'camera'}
                            minconfidence=${this.minConfidence}
                            @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </-video>`;
                break;

            case 'handpose':
                return html`
                    <handpose-video 
                            id="player"
                            source=${this.currentSource}
                            ?camera=${this.currentSource === 'camera'}
                            minconfidence=${this.minConfidence}
                            @endrecording=${this.onRecordingFinished}>
                        <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                        <pose-playback-controls></pose-playback-controls>
                    </handpose-video>`;
                break;

            case 'pose':
                return html`<pose-player id="player" autoplay posedata=${this.currentPoseFile} islooping>
                    <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
                    <pose-playback-controls></pose-playback-controls>
                </pose-player>`;

            default:
                return undefined;
        }
    }
}
