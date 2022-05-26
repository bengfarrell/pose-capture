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
}

export interface Player extends PlayerState {
    get videoBounds(): Bounds;

    pause(): void;

    play(): void;

    togglePlayback(): void;

    get naturalSize(): { width: number, height: number };
}

export class BasePlayer extends HTMLElement implements Player {
    constructor() {
        super();
        this.addEventListener(PlaybackEvent.Type, this.handleControlsEvent as any);
    }

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

    public set currentTime(_val: number) {}

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

            case PlaybackEvent.TIMELINE_SCRUB:
                this.pause();
                this.currentTime = e.state.currentTime;
                break;
        }
    }
}