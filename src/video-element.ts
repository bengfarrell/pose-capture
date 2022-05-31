import { Events } from './events';
import { BasePlayer } from "./baseplayer";

export class Video extends BasePlayer {

    static get observedAttributes() {
        return ['camera', 'source', 'islooping', 'playbackrate']
    }

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

    /**
     * get access to video element
     */
    public get videoElement() {
        return this.videoEl;
    }

    public get canRecord() {
        return true;
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
                    
                ::slotted(*) {
                    width: 100%;
                }
            </style>
            <video playsinline></video>
            <slot></slot>`;
        }

        this.videoEl = this.shadowRoot?.querySelector('video') as HTMLVideoElement;

        if (this._isLooping) {
            this.videoEl.loop = true;
        }
        this._isPlaying = false;

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
            this._isPlaying = false;
            clearInterval(this.timer as number);
            this.dispatchEvent(new Event(Events.VIDEO_PAUSE, { bubbles: true, composed: true }));
        }

        this.videoEl.onended = () => this.onEnded();

        this.videoEl.onplaying = () => {
            if (this._isPlaying) {
                this.dispatchEvent(new Event(Events.VIDEO_LOOP, { bubbles: true, composed: true }));
            } else {
                this._isPlaying = true;
                this.videoEl.playbackRate = this._playbackRate;
                clearInterval(this.timer as number);
                this.timer = window.setInterval(() => {
                    this.onTimerUpdate();
                }, 100);
                this.dispatchEvent(new Event(Events.VIDEO_PLAY, { bubbles: true, composed: true }));
            }
        }
    }

    protected onTimerUpdate() {
        /*
            // DOES NOT WORK! Pauses the video no matter what
            if (this.isLooping) {
                this.dispatchEvent(new Event(Events.VIDEO_LOOP, { bubbles: true, composed: true }));
            } else {
                this.pause();
                this.onEnded();
            }
        */
        this._currentTime = this.videoEl.currentTime * 1000;
        this.updateControls();
        this.dispatchEvent(new Event(Events.TIME_UPDATE, { bubbles: true, composed: true }));
    }

    public pause() {
        this.videoEl.pause();
    }

    public play() {
        this.videoEl.play();
    }

    public togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    public step(frames: number) {
        this.pause();
        // hard coded step value based on 24fps
        this.videoEl.currentTime += .04166 * frames;
    }

    protected seekTo(val: number) {
        this.videoEl.currentTime = val / 1000;
    }

    protected changePlaybackRate(rate: number) {
        this.videoEl.playbackRate = rate;
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

    protected onEnded() {
        clearInterval(this.timer as number);
        this.dispatchEvent(new Event(Events.VIDEO_END, {bubbles: true, composed: true }));
    }

    protected onMetadata() {
        this.resize();
        this.dispatchEvent(new Event(Events.METADATA, { bubbles: true, composed: true }));
        this._duration = this.videoEl.duration * 1000;
        this.updateControls();
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
            // @ts-ignore
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
            this.videoEl.muted = true;
            sourceChange = true;
        } else if (!this.hasAttribute('camera') && this.videoEl.srcObject) {
            // @ts-ignore
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

            case 'islooping':
                this._isLooping = this.hasAttribute('islooping');
                this.videoEl.loop = this._isLooping;
                break;

            case 'playbackrate':
                this._playbackRate = Number(this.getAttribute('playbackRate'));
                this.videoEl.playbackRate = this.playbackRate;
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
        clearInterval(this.timer as number);
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
