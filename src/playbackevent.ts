import { AbstractPlayerState } from './abstractplayer';

export class PlaybackEvent extends Event {
    public static Type: string = 'playcontrolsevent';

    public static TOGGLE_PLAYBACK = 'onTogglePlayback';

    public static PLAYBACK_TIME_UPDATE = 'onPlaybackTimeUpdate';

    public static TIMELINE_SCRUB = 'onTimelineScrub';

    public static LOOP = 'onLoopChange';

    public action: string;

    public state: AbstractPlayerState;

    public constructor(action: string, state: AbstractPlayerState, eventInitDict: EventInit) {
        super(PlaybackEvent.Type, eventInitDict);
        this.action = action;
        this.state = this.stateAsJSON(state);
    }

    protected stateAsJSON(state: AbstractPlayerState): AbstractPlayerState {
        return {
            currentTime: state.currentTime,
            duration: state.duration,
            isLooping: state.isLooping,
            isPlaying: state.isPlaying,
        }
    }
}
