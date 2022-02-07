import { Events } from './events';
import { Bounds } from "./abstractplayer";

export class Video extends HTMLElement {
    static get observedAttributes() {
        return ['camera', 'source', 'loop']
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
     * video element
     */
    protected videoEl: HTMLVideoElement;

    /**
     * video stream
     */
    protected stream?: MediaStream;

    /**
     * timer for driving playback status
     */
    protected timer?: number;

    /**
     * if component is mounted
     */
    protected isComponentMounted: boolean = false;

    public get videoBounds() {
        return this.visibleMediaRect;
    }

    public get duration() {
        return this.videoEl.duration;
    }

    /**
     * get access to video element
     */
    public get videoElement() {
        return this.videoEl;
    }

    /**
     * get video element's natural size
     */
    public get naturalSize() {
        return {
            width: this.videoEl.videoWidth,
            height: this.videoEl.videoHeight
        };
    }

    constructor() {
        super();
        this.attachShadow( { mode: 'open' } );

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    overflow: hidden;
                    position: relative;
                }
                
                :host(.connected) {
                    display: inline-block;
                }
                
                video, ::slotted(*) {
                    position: absolute;
                }
            </style>
            <video playsinline></video>
            <slot></slot>`;
        }

        this.videoEl = this.shadowRoot?.querySelector('video') as HTMLVideoElement;

        if (this.loop) {
            this.videoEl.loop = true;
        }
        this.playing = false;

        this.videoEl.onloadedmetadata = () => this.onMetadata();
        this.videoEl.onloadeddata = () => {
            if (this.hasAttribute('autoplay') || this.hasAttribute('camera')) {
                if (this.hasAttribute('mute')) {
                    this.videoEl.muted = true;
                }
                this.play();
            }
        };

        this.videoEl.onpause = () => {
            this.playing = false;
            clearInterval(this.timer);
            this.dispatchEvent(new Event(Events.VIDEO_PAUSE, { bubbles: true, composed: true }));
        }

        this.videoEl.onended = () => this.onEnded();

        this.videoEl.onplaying = () => {
            if (this.playing) {
                this.dispatchEvent(new Event(Events.VIDEO_LOOP, { bubbles: true, composed: true }));
            } else {
                this.playing = true;
                clearInterval(this.timer);
                this.timer = window.setInterval(() => {
                    if (this.loop) {
                        this.dispatchEvent(new Event(Events.VIDEO_LOOP, { bubbles: true, composed: true }));
                    } else {
                        this.pause();
                        this.onEnded();
                    }

                    this.dispatchEvent(new Event(Events.TIME_UPDATE, { bubbles: true, composed: true }));
                }, 100);
                this.dispatchEvent(new Event(Events.VIDEO_PLAY, { bubbles: true, composed: true }));
            }
        }
    }

    public pause() {
        this.videoEl.pause();
    }

    public play() {
        this.videoEl.play();
    }

    public togglePlayback() {
        if (this.playing) {
            this.videoEl.pause();
        } else {
            this.videoEl.play();
        }
    }

    public get source() {
        if (this.hasAttribute('camera')) {
            return 'camera';
        }
        return this.getAttribute('source') || '';
    }

    public set source(val: string) {
        this.videoEl.src = val;
    }

    public get currentTime() {
        return this.videoEl.currentTime || 0;
    }

    public set currentTime(val) {
        this.videoEl.currentTime = val;
        this.dispatchEvent(new Event(Events.TIME_UPDATE, { bubbles: true, composed: true }));
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

    protected onMetadata() {
        this.aspectRatio = (this.videoEl.videoWidth || 1) / (this.videoEl.videoHeight || 1);
        this.resize();
        this.dispatchEvent(new Event(Events.METADATA, { bubbles: true, composed: true }));
    }

    protected connectedCallback() {
        this.classList.toggle('connected', true );
        this.isComponentMounted = true;
        // delay loading giving plenty of time to resize and get settled
        // this avoids a resize flash from video sizing itself, and also incorrect size being given to pose detect during launch
        setTimeout( () => this.loadCurrentSource() , 1000 );
    }

    protected async loadCurrentSource() {
        let sourceChange = false;
        if (this.hasAttribute('source')) {
            this.videoEl.srcObject = null;
            this.videoEl.src = this.getAttribute('source') || '';

            if (this.stream) {
                this.stream.getTracks()[0].stop();
                this.stream = undefined;
            }
            sourceChange = true;
        }

        if (this.hasAttribute('camera')) {
            this.stream = await navigator.mediaDevices.getUserMedia({
                'audio': true,
                'video': {
                    width: this.width,
                    height: this.height,
                },
            });
            this.videoEl.srcObject = this.stream;
            this.videoEl.muted = false;
            sourceChange = true;
        } else if (!this.hasAttribute('camera') && this.videoEl.srcObject) {
            this.videoEl.srcObject = null;
            if (this.stream) {
                this.stream.getTracks()[0].stop();
                this.stream = undefined;
            }
            sourceChange = true;
        }

        if (sourceChange) {
            this.dispatchEvent(new Event(Events.VIDEO_SOURCE_CHANGED, { bubbles: true, composed: true }));
        }
    }

    protected async attributeChangedCallback(name: string, oldval: any, newval: any) {
        switch (name) {
            case 'source':
                if (newval !== oldval && this.isComponentMounted && !this.hasAttribute('camera')) {
                    this.loadCurrentSource();
                }
                break;
            case 'camera':
                if (this.isComponentMounted) {
                    this.loadCurrentSource();
                }
                break;

            case 'loop':
                this.loop = this.hasAttribute('loop');
                this.videoEl.loop = this.loop;
                break;

            default:
                break;
        }
    }

    /**
     * update canvas dimensions when resized
     */
    protected resize() {
        const bounds = this.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) {
            return;
        }

        let mediaScaledWidth = bounds.width;
        let mediaScaledHeight = bounds.height;
        const componentAspectRatio = bounds.width/bounds.height;

        // calculate letterbox borders
        let letterBoxLeft;
        let letterBoxTop;
        if (componentAspectRatio < this.aspectRatio) {
            mediaScaledHeight = bounds.width / this.aspectRatio;
            letterBoxTop = bounds.height/2 - mediaScaledHeight/2;
            letterBoxLeft = 0;
        } else if (componentAspectRatio > this.aspectRatio) {
            mediaScaledWidth = bounds.height * this.aspectRatio;
            letterBoxLeft = bounds.width/2 - mediaScaledWidth/2;
            letterBoxTop = 0;
        } else {
            letterBoxTop = 0;
            letterBoxLeft = 0;
        }

        this.visibleMediaRect.x = letterBoxLeft;
        this.visibleMediaRect.y = letterBoxTop;
        this.visibleMediaRect.width = mediaScaledWidth;
        this.visibleMediaRect.height = mediaScaledHeight;

        // set video to component size
        this.videoEl.setAttribute('width', String(mediaScaledWidth));
        this.videoEl.setAttribute('height', String(mediaScaledHeight));
        this.videoEl.style.left = `${letterBoxLeft}px`;
        this.videoEl.style.top = `${letterBoxTop}px`;
    }

    protected disconnectedCallback() {
        clearInterval(this.timer);
        this.isComponentMounted = false;
        if (this.stream) {
            const tracks = this.stream.getTracks();
            tracks.forEach( track => {
                track.stop();
            });
        }
    }
}

customElements.define('video-base', Video);
