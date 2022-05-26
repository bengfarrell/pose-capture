import { VideoPoseBase } from './videopose-element';
import {load, processFrame} from './tensorflow/handpose';

export default class HandPoseVideo extends VideoPoseBase {
    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if (this.isPlaying && this.videoEl.readyState > 1) {
            const result = await processFrame(this);
            this.onPoseFrame(result);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('handpose-video', HandPoseVideo);
