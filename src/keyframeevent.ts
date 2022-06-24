import { Keyframe } from './videopose-element';

export class KeyframeEvent extends Event {

    public static EventName = 'poseKeyframe';

    public poseType: string;

    public keyframes: Keyframe[];

    constructor(poseType: string, keyframes: Keyframe[], eventInit: EventInit) {
        super(KeyframeEvent.EventName, eventInit);
        this.poseType = poseType;
        this.keyframes = keyframes;
    }

    public getPartLocation(name: string, poseIndex = 0) {
        if (this.keyframes.length > poseIndex) {
            const keyframe = this.keyframes[poseIndex];
            const filtered = keyframe.points.filter(pt => name === pt.name);
            if (filtered.length > 0) {
                return filtered[0];
            }
        }
        return undefined;
    }
}