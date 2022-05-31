import {PlaybackEvent} from "./playbackevent";

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PlayerState {
    isLooping: boolean;

    currentTime: number;

    duration: number;

    isPlaying: boolean;

    isRecording: boolean,

    isAudioRecording: boolean;

    recordingDuration: number;

    playbackRate: number;
}

export interface Player extends PlayerState {
    get videoBounds(): Bounds;

    get canRecord(): boolean;

    pause(): void;

    play(): void;

    step(frame: number): void;

    togglePlayback(): void;

    get naturalSize(): { width: number, height: number };
}

export class BasePlayer extends HTMLElement implements Player {
    constructor() {
        super();
        this.addEventListener(PlaybackEvent.Type, this.handleControlsEvent as any);
    }

    public get canRecord() {
        return false;
    }

    /**
     * playback rate
     */
    protected _playbackRate: number = this.hasAttribute('playbackRate') ?
        Number(this.getAttribute('playbackRate')) : 1;

    public get playbackRate() {
        return this._playbackRate;
    }

    public set playbackRate(val: number) {
        this._playbackRate = val;
        if (this._playbackRate) {
            this.setAttribute('playbackrate', String(val));
        }
        this.changePlaybackRate(val);
    }

    /**
     * is video looping?
     */
    protected _isLooping: boolean = this.hasAttribute('islooping');

    public get isLooping() {
        return this._isLooping;
    }

    public set isLooping(val: boolean) {
        this._isLooping = val;
        if (this._isLooping) {
            this.setAttribute('islooping', '');
        } else {
            this.removeAttribute('islooping');
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
     * is recording?
     */
    protected _isRecording: boolean = false;

    public get isRecording() {
        return this._isRecording;
    }

    /**
     * is audio recording?
     */
    protected _isAudioRecording: boolean = false;

    public get isAudioRecording() {
        return this._isAudioRecording;
    }

    /**
     * current playback time
     */
    protected _currentTime: number = 0;

    public get currentTime() {
        return this._currentTime;
    }

    public set currentTime(_val: number) {
        this.seekTo(_val);
    }

    /**
     * video duration
     */
    protected _duration: number = 0;

    public get duration() {
        return this._duration;
    }

    /**
     * recording duration
     */
    protected _recordingDuration: number = -1;

    public get recordingDuration() {
        return this._recordingDuration;
    }

    /**
     * width of component
     */
    public get width(): number {
        return this.getBoundingClientRect().width;
    }

    /**
     * height of component
     */
    public get height(): number {
        return this.getBoundingClientRect().height;
    }

    /**
     * aspect ratio of video
     */
    public get aspectRatio() {
        return this.visibleMediaRect.width / this.visibleMediaRect.height;
    }

    get videoBounds(): Bounds {
        return {
            x: this.visibleMediaRect.x,
            y: this.visibleMediaRect.y,
            width: this.visibleMediaRect.width,
            height: this.visibleMediaRect.height
        }
    }

    /**
     * get video element's natural size
     */
    public get naturalSize() {
        return {
            width: this.visibleMediaRect.width,
            height: this.visibleMediaRect.height
        };
    }

    /**
     * visible area bounding box
     */
    protected visibleMediaRect: Bounds = { x: 0, y: 0, width: 0, height: 0 };

    public pause() {}

    public play() {}

    public togglePlayback() {}

    public step(_frame: number) {}

    protected seekTo(_ms: number) {}

    protected changePlaybackRate(_rate: number) {}

    protected updateControls() {
        const slot = this.shadowRoot?.querySelector('slot');
        if (slot) {
            slot.assignedElements().forEach( (slotted: any) => {
                const controls: PlayerState = slotted;
                if (controls) {
                    controls.isLooping = this.isLooping;
                    controls.isPlaying = this.isPlaying;
                    controls.currentTime = this.currentTime;
                    controls.duration = this.duration;
                    controls.recordingDuration = this.recordingDuration;
                    controls.isRecording = this.isRecording;
                    controls.isAudioRecording = this.isAudioRecording;
                    controls.playbackRate = this.playbackRate;
                }
            });
        }
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

            case PlaybackEvent.STEP_FORWARD:
                this.pause();
                this.step(1);
                break;

            case PlaybackEvent.STEP_BACKWARD:
                this.pause();
                this.step(-1);
                break;

            case PlaybackEvent.TIMELINE_SCRUB:
                this.currentTime = e.state.currentTime;
                break;

            case PlaybackEvent.PLAYBACK_RATE_UPDATE:
                this.playbackRate = e.state.playbackRate;
                break;
        }
    }
}
