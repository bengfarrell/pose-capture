import { VideoPoseBase } from './videopose-element';
import {load, processFrame, parts} from './tensorflow/bodypix.js';

export default class BodyPixVideo extends VideoPoseBase {
    get poseType() { return 'bodypix'; }

    get parts() {
        return parts;
    }

    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if ((this.isPlaying || this.forceOneTimePoseProcess) && this.videoEl.readyState > 1) {
            const result = await processFrame(this, this.recordingStartTime as number, this.minConfidence / 100);
            this.onPoseFrame(result);
            this.forceOneTimePoseProcess = false;
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('bodypix-video', BodyPixVideo);
