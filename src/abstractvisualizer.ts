import { Bounds } from './baseplayer';
import { Keyframe } from './videopose-element';

export abstract class AbstractPoseVisualizer {
    abstract clear(): void;
    abstract draw(keyframes: Keyframe[], bounds: Bounds): void;
}
