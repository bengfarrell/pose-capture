import { VideoPoseBase } from './videopose-element';
import {load, processFrame} from './tensorflow/posedetection';

export default class PoseDetectionVideo extends VideoPoseBase {
    get poseType() { return 'posedetection'; }

    get parts() {
        return [
            'nose',
            'left_eye_inner',
            'left_eye',
            'left_eye_outer',
            'right_eye_inner',
            'right_eye',
            'right_eye_outer',
            'left_ear',
            'right_ear',
            'mouth_left',
            'mouth_right',
            'left_shoulder',
            'right_shoulder',
            'left_elbow',
            'right_elbow',
            'left_wrist',
            'right_wrist',
            'left_pinky',
            'right_pinky',
            'left_index',
            'right_index',
            'left_thumb',
            'right_thumb',
            'left_hip',
            'right_hip',
            'left_knee',
            'right_knee',
            'left_ankle',
            'right_ankle',
            'left_heel',
            'right_heel',
            'left_foot_index',
            'right_foot_index'
        ];
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

customElements.define('posedetection-video', PoseDetectionVideo);
