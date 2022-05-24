export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class AbstractPlayerState {
    abstract isLooping: boolean;

    abstract isPlaying: boolean;

    abstract currentTime: number;

    abstract duration: number;
}

export abstract class AbstractPlayer extends AbstractPlayerState {

    abstract get videoBounds(): Bounds;

    abstract pause(): void;

    abstract play(): void;

    abstract togglePlayback(): void;

    abstract get naturalSize(): { width: number, height: number };

}
