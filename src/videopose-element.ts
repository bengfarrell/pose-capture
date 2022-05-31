import { Video } from './video-element';
import { AbstractPoseVisualizer } from './abstractvisualizer';
import { Events} from './events';
import { PlaybackEvent } from './playbackevent';

export interface Point {
    name?: string;
    score?: number;
    position: number[];
}

export interface Keyframe {
    time: number;
    pose: number;
    aspectRatio: number;
    score?: number;
    points: Point[];
}

export class VideoPoseBase extends Video {
    protected _keyframes: Keyframe[] = [];

    protected hasStarted: boolean = false;

    protected audioRecorder?: MediaRecorder;

    protected audioData?: string;

    protected forceOneTimePoseProcess: boolean = false;

    protected recordingStartTime?: number;

    protected recordedAudio?: Blob;

    constructor() {
        super();
        this.addEventListener(PlaybackEvent.Type, this.handleControlsEvent as any);
    }

    public get keyframes() {
        return this._keyframes.slice();
    }

    public get recording() {
        return {
            keyframes: this.keyframes,
            audio: this.audioData,
            duration: this.recordingDuration
        }
    }

    public step(frames: number) {
        super.step(frames);
        this.forceOneTimePoseProcess = true;
    }

    protected onPoseFrame(keyframes: Keyframe[]) {
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.dispatchEvent(new Event(Events.POSE_TRACKING_STARTED, { bubbles: true, composed: true }));
        }
        const slot = this.shadowRoot?.querySelector('slot');
        if (slot) {
            slot.assignedElements().forEach( (slotted: any) => {
                if (slotted.draw) {
                    const viz: AbstractPoseVisualizer = slotted as unknown as AbstractPoseVisualizer;
                    viz.draw(keyframes, this.videoBounds);
                }
            });
        }

        if (this.isRecording) {
            this._keyframes.push(...keyframes);
        }
    }

    protected onTimerUpdate() {
        if (this.isRecording && this.recordingStartTime) {
            this._recordingDuration = Date.now() - this.recordingStartTime;
        }
        super.onTimerUpdate();
    }

    startRecording(includeAudio: boolean = false) {
        if (this.isRecording) {
            return;
        }
        this._isRecording = true;
        this._isAudioRecording = includeAudio;
        this.recordingStartTime = Date.now();
        this._keyframes = [];
        this.recordedAudio = undefined;
        this.audioData = undefined;
        this.updateControls();
        if (includeAudio) {
            const stream = (this.videoEl as any).captureStream();

            if (stream.getAudioTracks().length > 0) {
                const audiostream = new MediaStream();
                audiostream.addTrack(stream.getAudioTracks()[0]);
                const segments: Blob[] = [];
                this.audioRecorder = new MediaRecorder(audiostream);
                this.audioRecorder.ondataavailable = (e: any) => {
                    segments.push(e.data);
                    this.recordedAudio = new Blob(segments);
                    if (this.recordedAudio) {
                        const reader = new FileReader();
                        reader.readAsDataURL(this.recordedAudio);
                        new Promise(() => {
                            reader.onloadend = () => {
                                this.audioData = (reader.result as string).replace('application/octet-stream', 'audio/webm');
                            };
                        });
                    }
                }
                this.audioRecorder.start();
            }
        }
    }

    stopRecording() {
        this._isRecording = false;
        this._isAudioRecording = false;
        if (this.recordingStartTime) {
            this._recordingDuration = Date.now() - this.recordingStartTime;
        }

        this.updateControls();
        if (this.audioRecorder) {
            this.audioRecorder.requestData();
            this.audioRecorder.stop();
            this.audioRecorder = undefined;
        }
        this.dispatchEvent(new Event(Events.END_RECORDING, { bubbles: true, composed: true }));
    }

    protected onEnded() {
        super.onEnded();
        this.stopRecording();
    }

    protected handleControlsEvent(e: PlaybackEvent) {
        super.handleControlsEvent(e);
        switch (e.action) {
            case PlaybackEvent.TOGGLE_RECORD_POSE:
                if (!this._isRecording) {
                  this.startRecording(false);
                } else {
                    this.stopRecording();
                }
                break;

            case PlaybackEvent.TOGGLE_RECORD_POSE_AND_AUDIO:
                if (!this._isRecording) {
                    this.startRecording(true);
                } else {
                    this.stopRecording();
                }
        }
    }
}
