import {Keyframe} from "./videopose-element";
import {AbstractPlayer, Bounds} from "./abstractplayer";
import {Events} from "./events";

export default class PosePlayer extends HTMLElement implements AbstractPlayer {
    static get observedAttributes() {
        return ['loop']
    }

    protected _keyframes: Keyframe[] = [];

    protected _audio?: Blob;

    /*set data(data) {

    }*/

    public loadPoseData(uri: string) {
        fetch(uri)
            .then(function(response) {
                return response.json()
            })
            .then(function(_response) {
                // let objectURL = URL.createObjectURL(response);
                // myImage.src = objectURL;
            });
    }

    /**
     * whether to loop video playback
     */
    public loop: boolean = false;

    /**
     * is video playing?
     */
    protected playing: boolean = false;

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

    public get duration() {
        return 0; // this.videoEl.duration;
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

    constructor() {
        super();
        this.attachShadow( { mode: 'open' } );

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
            <slot></slot>`;
        }

        this.playing = false;
    }

    public pause() {
    }

    public play() {
    }

    public togglePlayback() {
        if (this.playing) {
            // this.videoEl.pause();
        } else {
            // this.videoEl.play();
        }
    }

    public get currentTime() {
        return 0;
    }

    public set currentTime(_val) {
        // this.videoEl.currentTime = val;
        // this.dispatchEvent(new Event(Events.TIME_UPDATE, { bubbles: true, composed: true }));
    }

    /**
     * set current time based on percentage through video
     */
    public set currentPercent(val) {
        this.currentTime = (val / 100) * this.duration;
    }

    /**
     * get current time based on percentage through video
     */
    public get currentPercent() {
        return (this.currentTime / this.duration) * 100;
    }

    protected onEnded() {
        clearInterval(this.timer);
        this.dispatchEvent(new Event(Events.VIDEO_END, {bubbles: true, composed: true }));
    }

    protected attributeChangedCallback(name: string, _oldval: string, newval: string ) {
        switch (name) {
            case 'loop':
                this.loop = this.hasAttribute('loop');
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
