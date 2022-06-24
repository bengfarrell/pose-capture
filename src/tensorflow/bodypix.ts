import {bodypix} from '../../libs/bodypix-bundle.js';
import '../../libs/tensorflow-bundle.js';
import {BodyPix} from '@tensorflow-models/body-pix/dist/body_pix_model';
import {VideoPoseBase, Keyframe} from "../videopose-element";
import {Keypoint, Pose} from "@tensorflow-models/body-pix/dist/types";

let model: BodyPix | undefined;

export const load = async function() {
    if (model) {
        model.dispose();
        model = undefined;
    }

    model = await bodypix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.5,
        quantBytes: 2
    });
}

export const parts = bodypix.PART_CHANNELS;

export const processFrame = async function (source: VideoPoseBase, recordingStartTime = 0, minConfidence = 0) {
    const keyframes: Keyframe[] = [];
    if (model) {
        const parts = await model.segmentPersonParts(source.videoElement, {
            internalResolution: 'medium',
            segmentationThreshold: 0.7,
            maxDetections: 1,
            scoreThreshold: 0.3,
            nmsRadius: 20,
        });

        if (parts) {
            parts.allPoses.forEach((pose: Pose, index) => {
                const keyframe: Keyframe = {
                    time: Date.now() - recordingStartTime,
                    score: pose.score,
                    pose: index,
                    points: [],
                    aspectRatio: source.aspectRatio
                }
                pose.keypoints.forEach((keypoint: Keypoint) => {
                    if (keypoint.score >= minConfidence) {
                        keyframe.points.push({
                            name: keypoint.part,
                            score: keypoint.score,
                            position: [
                                keypoint.position.x / source.videoElement.width,
                                keypoint.position.y / source.videoElement.height,
                            ]
                        });
                    }
                });
                keyframes.push(keyframe);
            });
        }
    }
    return keyframes;
}
