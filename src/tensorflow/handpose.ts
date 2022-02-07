// @ts-ignore
import * as handPoseDetection from '../../libs/handpose-bundle.js';
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';
import {Keyframe, VideoPoseBase} from "../videopose-element";
import { Keypoint } from "@tensorflow-models/hand-pose-detection/dist/types";

const handpose = handPoseDetection.handpose;

let detector: HandDetector;

export const load = async function() {
    const model = handpose.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: 'tfjs', // mediapipe',
        modelType: 'full'
    };
    detector = await handpose.createDetector(model, detectorConfig);
}

export const processFrame = async (source: VideoPoseBase) => {
    const keyframes: Keyframe[] = [];
    if (detector) {
        const hands = await detector.estimateHands(source.videoElement);
        hands.forEach( (hand: Hand, index) => {
            const keyframe: Keyframe = {
                time: Date.now(),
                score: hand.score,
                pose: index,
                points: [],
                bounds: {}
            }
            // Todo: keypoints3D are in meters, how best to surface this data?
            hand.keypoints?.forEach( (keypoint: Keypoint) => {
                keyframe.points.push({
                    name: keypoint.name,
                    position: [
                        keypoint.x / source.naturalSize.width,
                        keypoint.y / source.naturalSize.height ]
                });
            })
            keyframes.push(keyframe);
        });
    }
    console.log(keyframes)
    return keyframes;
}
