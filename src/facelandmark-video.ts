import { VideoPoseBase } from './videopose-element';
import {load, processFrame} from './tensorflow/facelandmarks';

export default class FaceLandmarkVideo extends VideoPoseBase {
    static get observedAttributes() {
        return super.observedAttributes.concat('maximumFaces', 'includeMeshPoints');
    }

    async onMetadata() {
        super.onMetadata();
        await load();
        this.poseDetectionFrame();
    }

    async poseDetectionFrame() {
        const maximumFaces: number = this.hasAttribute('maximumFaces') ? Number(this.getAttribute('maximumFaces')) : 1;
        if (this.playing && this.videoEl.readyState > 1) {
            const result = await processFrame(this, {
                maximumFaces,
                includeMeshPoints: this.hasAttribute('includeMeshPoints') });
            this.onPoseFrame(result);
        }
        requestAnimationFrame( () => this.poseDetectionFrame());
    }
}

customElements.define('facelandmark-video', FaceLandmarkVideo);