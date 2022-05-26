import { Keyframe } from './videopose-element';
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

    public loadPoseData(uri: string) {
        fetch(uri)
            .then((response) => {
                return response.json()
            })
            .then((json) => {
                this.keyframes = json.keyframes;
                // temporarily massage times such that we start with 0
                const firstKeyTime = json.keyframes[0].time;
                this.keyframes.forEach((keyframe: Keyframe) => {
                    keyframe.time -= firstKeyTime;
                }) ;

                if (json.audio) {
                    this.audio = new Audio(json.audio);
                }

                this._duration = this.keyframes[this.keyframes.length - 1].time;
                this.updateControls();

                if (this.hasAttribute('autoplay')) {
                    this.play();
                } else {
                    this.renderPose();
                }
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

    public pause() {
        this.audio?.pause();
        this._isPlaying = false;
    }

    public play() {
        this._isPlaying = true;
        this.playStartTime = Date.now();

        // this.audio?.play();

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
        this._currentTime = Date.now() - this.playStartTime;
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
        this._currentTime = val;
        if (this.audio) {
            this.audio.currentTime = val;
        }
        for (let c = 0; c < this.keyframes.length; c++) {
            if (this.keyframes[c].time > this.currentTime) {
                this.currentKeyframe = c;
                this.renderPose();
                break;
            }
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
