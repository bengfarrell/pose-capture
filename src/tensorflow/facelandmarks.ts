import { facelandmarks } from '../../libs/facelandmarks-bundle.js';
import '../../../libs/tensorflow-bundle.js';
import {FaceLandmarksDetector} from "@tensorflow-models/face-landmarks-detection/dist/types";
import {
    AnnotatedPrediction,
} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import {Keyframe, VideoPoseBase} from "../videopose-element";

let model: FaceLandmarksDetector;

export interface FacelandmarksOptions {
    maximumFaces: number;
    includeMeshPoints?: boolean;
}

export const load = async function() {
    model = await facelandmarks.load(
        facelandmarks.SupportedPackages.mediapipeFacemesh);
}

export const processFrame = async (source: VideoPoseBase, options: FacelandmarksOptions) => {
    const keyframes: Keyframe[] = [];
    if (model) {
        const predictions: AnnotatedPrediction[] = await model.estimateFaces({
            input: source.videoElement
        });

        const numPredictions = Math.min(predictions.length, options.maximumFaces || 1);
        for (let p = 0; p < numPredictions; p++) {
            const prediction = predictions[p];
            const mesh: number[][] = (prediction.scaledMesh as number[][]).slice();
            const max = [-Infinity, -Infinity, -Infinity];
            const min = [Infinity, Infinity, Infinity];
            const keyframe: Keyframe = {
                time: Date.now(),
                pose: p,
                points: [],
                bounds: {}
            }

            Object.keys((prediction as any).annotations).forEach((name: string) => {
                const cluster = (prediction as any).annotations[name];
                for (let c = 0; c < cluster.length; c++) {
                    const point = cluster[c];
                    keyframe.points.push({
                        name,
                        position: [
                            point[0] / source.naturalSize.width,
                            point[1] / source.naturalSize.height,
                            point[2]
                        ]
                    });
                    min[0] = Math.min(point[0], min[0]);
                    min[1] = Math.min(point[1], min[1]);
                    min[2] = Math.min(point[2], min[2]);
                    max[0] = Math.max(point[0], max[0]);
                    max[1] = Math.max(point[1], max[1]);
                    max[2] = Math.max(point[2], max[2]);


                    if (options.includeMeshPoints) {
                        // prune any found and annotated points from the mesh list
                        const found = mesh.findIndex(meshcoord => {
                            return point[0] === meshcoord[0] &&
                                point[1] === meshcoord[1] &&
                                point[2] === meshcoord[2];
                        });
                        if (found !== -1) {
                            mesh.splice(found, 1);
                        }
                    }
                }
            });

            // add rest of un-named mesh points
            if (options.includeMeshPoints) {
                for (let d = 0; d < mesh.length; d++) {
                    const point = mesh[d];
                    keyframe.points.push({
                        position: [
                            point[0] / source.naturalSize.width,
                            point[1] / source.naturalSize.height,
                            point[2]
                        ]
                    });
                    min[0] = Math.min(point[0], min[0]);
                    min[1] = Math.min(point[1], min[1]);
                    min[2] = Math.min(point[2], min[2]);
                    max[0] = Math.max(point[0], max[0]);
                    max[1] = Math.max(point[1], max[1]);
                    max[2] = Math.max(point[2], max[2]);
                }
            }
            keyframe.bounds = { minX: min[0], minY: min[1], minZ: min[2], maxX: max[0], maxY: max[1], maxZ: max[2] }
            keyframes.push(keyframe);
        }
    }
    return keyframes;
}
