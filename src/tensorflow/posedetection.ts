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
                    min[0] = Math.min(keypoint.x, min[0]);
                    min[1] = Math.min(keypoint.y, min[1]);
                    min[2] = Math.min(keypoint.z || -Infinity, min[2]);
                    max[0] = Math.max(keypoint.x, max[0]);
                    max[1] = Math.max(keypoint.y, max[1]);
                    max[2] = Math.max(keypoint.z || Infinity, max[2]);
                });
                keyframe.bounds = { minX: min[0], minY: min[1], minZ: min[2], maxX: max[0], maxY: max[1], maxZ: max[2] }
                keyframes.push(keyframe);
            });
        }
    }
    return keyframes;
}
