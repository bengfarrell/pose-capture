import { VideoPoseBase } from './videopose-element';
import {load, processFrame} from './tensorflow/bodypix.js';

export default class BodyPixVideo extends VideoPoseBase {
    get poseType() { return 'body'; }

    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if (this.isPlaying && this.videoEl.readyState > 1) {
            const result = await processFrame(this, this.recordingStartTime as number);
            this.onPoseFrame(result);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('bodypix-video', BodyPixVideo);
