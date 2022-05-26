import { posedetection, PoseDetector } from '../../libs/posedetection-bundle.js';
import '../../../libs/tensorflow-bundle.js';
import {Keyframe, VideoPoseBase} from "../videopose-element";
import {Pose, Keypoint} from "@tensorflow-models/pose-detection"

let detector: PoseDetector;

export const load = async function() {
    const model = posedetection.SupportedModels.BlazePose;
    detector = await posedetection.createDetector(model, {
        runtime: 'mediapipe',
        modelType: 'BlazePose',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.4.1630009814`
    });
}

export const processFrame = async (source: VideoPoseBase) => {
    const keyframes: Keyframe[] = [];
    if (detector) {
        const poses = await detector.estimatePoses(source.videoElement);
        if (poses) {
            poses.forEach((pose: Pose, index: number) => {
                const max = [-Infinity, -Infinity, -Infinity];
                const min = [Infinity, Infinity, Infinity];
                const keyframe: Keyframe = {
                    time: Date.now(),
                    score: pose.score,
                    pose: index,
                    points: [],
                    bounds: {}
                }
                pose.keypoints?.forEach((keypoint: Keypoint) => {
                    keyframe.points.push({
                        name: keypoint.name,
                        score: keypoint.score,
                        position: [
                            keypoint.x / source.naturalSize.width,
                            keypoint.y / source.naturalSize.height,
                            keypoint.z as number
                        ]
                    });
                });
                keyframes.push(keyframe);
            });
        }
    }
    return keyframes;
}
