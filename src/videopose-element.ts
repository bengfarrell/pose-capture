import { Video } from "./video-element";
import { AbstractPoseVisualizer } from "./abstractvisualizer";
import {Events} from "./events";

export interface Point {
    name?: string;
    score?: number;
    position: number[];
}

export interface Keyframe {
    time: number;
    pose: number;
    bounds: { minX?: number; maxX?: number; minY?: number; maxY?: number; minZ?: number; maxZ?: number; }
    score?: number;
    points: Point[];
}

export class VideoPoseBase extends Video {
    protected _keyframes: Keyframe[] = [];

    protected recordingOn: boolean = false;

    protected hasStarted: boolean = false;

    protected audioRecorder?: MediaRecorder;

    protected recordedAudio?: Blob;

    public get isRecording(): boolean {
        return this.recordingOn;
    }

    public get keyframes() {
        return this._keyframes.slice();
    }

    public saveRecording() {
        const link = document.createElement('a');

        if (this.recordedAudio) {
            const reader = new FileReader();
            reader.readAsDataURL(this.recordedAudio);
            new Promise(() => {
                reader.onloadend = () => {
                    const data = `data:text/json;charset=utf-8,${
                        encodeURIComponent( JSON.stringify({
                            keyframes: this.keyframes,
                            audio: (reader.result as string).replace('application/octet-stream', 'audio/webm') }))}`;
                    link.setAttribute('download', 'posedata.json');
                    link.setAttribute('href', data);
                    link.click();
                };
            });
        } else {
            const data = `data:text/json;charset=utf-8,${
                encodeURIComponent( JSON.stringify({
                    keyframes: this.keyframes }))}`;
            link.setAttribute('download', 'posedata.json');
            link.setAttribute('href', data);
            link.click();
        }
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

        if (this.recordingOn) {
            this._keyframes.push(...keyframes);
        }
    }

    startRecording(includeAudio: boolean = false) {
        if (this.recordingOn) {
            return;
        }
        this.recordingOn = true;
        this._keyframes = [];
        this.recordedAudio = undefined;

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
                }
                this.audioRecorder.start();
            }
        }
    }

    stopRecording() {
        this.recordingOn = false;
        if (this.audioRecorder) {
            this.audioRecorder.requestData();
            this.audioRecorder.stop();
            this.audioRecorder = undefined;
        }
    }

    protected onEnded() {
        super.onEnded();
        this.stopRecording();
    }
}
