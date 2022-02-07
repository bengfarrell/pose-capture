export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class AbstractPlayer {
    abstract loop: boolean;

    abstract get videoBounds(): Bounds;

    abstract get duration(): number;

    abstract pause(): void;

    abstract play(): void;

    abstract togglePlayback(): void;

    abstract get naturalSize(): { width: number, height: number };

    abstract get currentTime(): number;

    abstract set currentTime(val);

    abstract set currentPercent(val);

    abstract get currentPercent(): number;

}
