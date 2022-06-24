import {Keyframe, PoseRecording} from './videopose-element';
import { Events } from './events';
import { AbstractPoseVisualizer } from './abstractvisualizer';
import {BasePlayer} from "./baseplayer";

export default class PosePlayer extends BasePlayer {
    static get observedAttributes() {
        return ['isLooping', 'posedata']
    }

    protected playStartTime = 0;

    protected currentKeyframe = 0;

    protected keyframes: Keyframe[] = [];

    protected audio?: HTMLAudioElement;

    /**
     * timer for driving playback status
     */
    protected timer?: number;

    public set recording(rec: PoseRecording) {
        this.keyframes = rec.keyframes;
        // temporarily massage times such that we start with 0
        const firstKeyTime = rec.keyframes[0].time;
        this.keyframes.forEach((keyframe: Keyframe) => {
            keyframe.time -= firstKeyTime;
        }) ;

        if (rec.audio) {
            this.audio = new Audio(rec.audio);
        }

        this._duration = this.keyframes[this.keyframes.length - 1].time;
        this.updateControls();

        if (this.hasAttribute('autoplay')) {
            this.play();
        } else {
            this.renderPose();
        }
    }

    public loadPoseData(uri: string) {
        fetch(uri)
            .then((response) => {
                return response.json()
            })
            .then((json) => {
               this.recording = json;
            }).catch(function() {
            console.warn(`Error, ${uri} cannot be found`);
        });
    }

    constructor() {
        super();
        this.attachShadow( { mode: 'open' } );

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    overflow: hidden;
                    position: relative;
                }
                
                ::slotted(*) {
                    position: absolute;
                    width: 100%;
                }
            </style>
            <slot></slot>`;
        }
    }

    protected connectedCallback() {
        super.connectedCallback();
        if (this.hasAttribute('posedata')) {
            this.loadPoseData(this.getAttribute('posedata') as string);
        }
    }

    public togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    public step(frame: number) {
        this.currentKeyframe += frame;
        if (this.currentKeyframe < 0) {
            this.currentKeyframe = 0;
        }
        if (this.currentKeyframe > this.keyframes.length - 1) {
            this.currentKeyframe = this.keyframes.length - 1;
        }
        this.renderPose();
    }

    public pause() {
        this.audio?.pause();
        this._isPlaying = false;
    }

    public play() {
        this._isPlaying = true;
        this.playStartTime = Date.now();

        this.audio?.play();

        if (this.audio) {
            this.audio.loop = this.isLooping;
        }
        this.renderFrame();
    }

    protected renderFrame() {
        if (this.keyframes.length === 0) {
            return;
        }
        if (this.currentKeyframe >= this.keyframes.length - 1) {
            if (this.isLooping) {
                this.currentKeyframe = 0;
                this.playStartTime = Date.now();
                this.renderPose();
            } else {
                this._isPlaying = false;
                return;
            }
        }
        this._currentTime = (Date.now() - this.playStartTime) * this._playbackRate;
        const next: Keyframe = this.keyframes[this.currentKeyframe + 1];
        if (this.currentTime > next.time) {
            this.currentKeyframe ++;
            this.renderPose();
        }

        this.updateControls();

        if (this.isPlaying) {
            requestAnimationFrame(() => {
                this.renderFrame();
            });
        }
    }

    protected renderPose() {
        const slot = this.shadowRoot?.querySelector('slot');
        if (slot) {
            slot.assignedElements().forEach( (slotted: any) => {
                if (slotted.draw) {
                    const viz: AbstractPoseVisualizer = slotted as unknown as AbstractPoseVisualizer;
                    viz.draw([ this.keyframes[this.currentKeyframe] ], this.getBoundingClientRect());
                }
            });
        }
    }

    protected _currentTime = 0;

    public get currentTime() {
        return this._currentTime;
    }

    public set currentTime(val) {
        this.playStartTime = Date.now() - val;
        this._currentTime = val;
        if (this.audio) {
            this.audio.currentTime = val / 1000;
        }

        if (this.keyframes.length > 0) {
            this.currentKeyframe = this.findNearestKeyframe(this._currentTime, this.keyframes);
            this.renderPose();
        }
    }

    protected findNearestKeyframe(time: number, keyframes: Keyframe[], _range?: number[]): number {
        if (keyframes.length === 1) {
            return 0;
        }

        const range = _range ? [_range[0], _range[1]] : [ 0, keyframes.length-1 ];
        if (range[1] - range[0] <= 1) {
            return keyframes[range[1]].time - time < time - keyframes[range[0]].time ? range[1] : range[0];
        }

        const lower = range[0];
        const mid = range[0] + Math.floor((range[1] - range[0]) / 2);
        const upper = range[1];
        if (time > keyframes[lower].time &&
            time < keyframes[mid].time) {
            return this.findNearestKeyframe(time, keyframes, [lower, mid]);
        } else {
            return this.findNearestKeyframe(time, keyframes, [mid, upper]);
        }
    }

    protected onEnded() {
        clearInterval(this.timer as number);
        this.dispatchEvent(new Event(Events.VIDEO_END, {bubbles: true, composed: true }));
    }

    protected attributeChangedCallback(name: string, _oldval: string, newval: string ) {
        switch (name) {
            case 'isLooping':
                this._isLooping = this.hasAttribute('isLooping');
                if (this.audio) {
                    this.audio.loop = this.isLooping;
                }
                break;

            case 'source':
                this.loadPoseData(newval);
                break;
            default:
                break;
        }
    }

    protected disconnectedCallback() {
        clearInterval(this.timer as number);
    }
}

customElements.define('pose-player', PosePlayer);
