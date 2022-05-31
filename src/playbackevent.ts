import { PlayerState } from './baseplayer';

export class PlaybackEvent extends Event {
    public static Type: string = 'playcontrolsevent';

    public static TOGGLE_PLAYBACK = 'onTogglePlayback';

    public static PLAYBACK_TIME_UPDATE = 'onPlaybackTimeUpdate';

    public static PLAYBACK_RATE_UPDATE = 'onPlaybackRateUpdate';

    public static TIMELINE_SCRUB = 'onTimelineScrub';

    public static TOGGLE_RECORD_POSE = 'onRecordPose';

    public static TOGGLE_RECORD_POSE_AND_AUDIO = 'onRecordPoseAndAudio';

    public static STEP_FORWARD = 'onStepForward';

    public static STEP_BACKWARD = 'onStepBackward';

    public static LOOP = 'onLoopChange';

    public action: string;

    public state: PlayerState;

    public constructor(action: string, state: PlayerState, eventInitDict: EventInit) {
        super(PlaybackEvent.Type, eventInitDict);
        this.action = action;
        this.state = this.toMinimalState(state);
    }

    protected toMinimalState(state: PlayerState): PlayerState {
        return {
            currentTime: state.currentTime,
            duration: state.duration,
            isLooping: state.isLooping,
            isPlaying: state.isPlaying,
            isRecording: state.isRecording,
            isAudioRecording: state.isAudioRecording,
            recordingDuration: state.recordingDuration,
            playbackRate: state.playbackRate
        }
    }
}
