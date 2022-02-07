import { VideoPoseBase } from './videopose-element';
import {load, processFrame} from './tensorflow/posedetection';

export default class PoseDetectionVideo extends VideoPoseBase {
    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        if (this.playing && this.videoEl.readyState > 1) {
            const result = await processFrame(this);
            this.onPoseFrame(result);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('posedetection-video', PoseDetectionVideo);
