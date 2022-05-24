import { Keyframe } from './videopose-element';
import {AbstractPlayer, AbstractPlayerState, Bounds} from './abstractplayer';
import { Events } from './events';
import { AbstractPoseVisualizer } from './abstractvisualizer';
import { PlaybackEvent } from './playbackevent';

export default class PosePlayer extends HTMLElement implements AbstractPlayer {
    static get observedAttributes() {
        return ['isLooping', 'posedata']
    }

    protected playStartTime = 0;

    protected currentKeyframe = 0;

    protected keyframes: Keyframe[] = [];

    protected audio?: HTMLAudioElement;

    /**
     * is video looping?
     */
    protected _isLooping: boolean = this.hasAttribute('isLooping');

    public get isLooping() {
        return this._isLooping;
    }

    public set isLooping(val: boolean) {
        this._isLooping = val;
        if (this._isLooping) {
            this.setAttribute('isLooping', '');
        } else {
            this.removeAttribute('isLooping');
        }
    }

    /**
     * is video playing?
     */
    protected _isPlaying: boolean = false;

    public get isPlaying() {
        return this._isPlaying;
    }

    /**
     * video duration
     */
    protected _duration: number = 0;

    public get duration() {
        return this._duration;
    }


    /**
     * width of component
     */
    protected width: number = 0;

    /**
     * height of component
     */
    protected height: number = 0;

    /**
     * aspect ratio of video
     */
    protected aspectRatio: number = 0;

    /**
     * visible area bounding box
     */
    protected visibleMediaRect: Bounds = { x: 0, y: 0, width: 0, height: 0 };

    /**
     * timer for driving playback status
     */
    protected timer?: number;

    public get videoBounds() {
        return this.visibleMediaRect;
    }

    /**
     * get video element's natural size
     */
    public get naturalSize() {
        return {
            width: 0, //this.videoEl.videoWidth,
            height: 0, // this.videoEl.videoHeight
        };
    }


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

        this.addEventListener(PlaybackEvent.Type, this.handleControlsEvent as any);

        this._isPlaying = false;
    }

    protected handleControlsEvent(e: PlaybackEvent) {
        switch (e.action) {
            case PlaybackEvent.TOGGLE_PLAYBACK:
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
                this.updateControls();
                break;

            case PlaybackEvent.LOOP:
                this.isLooping = !e.state.isLooping;
                this.updateControls();
                break;

            case PlaybackEvent.TIMELINE_SCRUB:
                this.pause();
                this.currentTime = e.state.currentTime;
                break;
        }
    }

    protected updateControls() {
        const slot = this.shadowRoot?.querySelector('slot');
        if (slot) {
            slot.assignedElements().forEach( (slotted: any) => {
                const controls: AbstractPlayerState = slotted;
                if (controls) {
                    controls.isLooping = this.isLooping;
                    controls.isPlaying = this.isPlaying;
                    controls.currentTime = this.currentTime;
                    controls.duration = this.duration;
                }
            });
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
        clearInterval(this.timer);
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
        clearInterval(this.timer);
    }

}

customElements.define('pose-player', PosePlayer);
