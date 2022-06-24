import { VideoPoseBase } from './videopose-element';
import {load, processFrame, parts} from './tensorflow/handpose';

export default class HandPoseVideo extends VideoPoseBase {
    get poseType() { return 'handpose'; }

    get parts() { return parts; }

    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if ((this.isPlaying || this.forceOneTimePoseProcess) && this.videoEl.readyState > 1) {
            const result = await processFrame(this, this.recordingStartTime as number, this.minConfidence / 100);
            this.onPoseFrame(result);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
        this.forceOneTimePoseProcess = false;
    }
}

customElements.define('handpose-video', HandPoseVideo);
