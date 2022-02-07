export class Events {
    static get VIDEO_END() { return 'onvideoend'; }

    static get VIDEO_PAUSE() { return 'onvideopause'; }

    static get VIDEO_PLAY() { return 'onvideoplay'; }

    static get VIDEO_LOOP() { return 'onvideoloop'; }

    static get VIDEO_SOURCE_CHANGED() { return 'onvideosourcechanged'; }

    static get TIME_UPDATE() { return 'onvideotimeupdate'; }

    static get METADATA() { return 'onvideometadata'; }

    static get POSE_TRACKING_STARTED() { return 'onPoseTrackingStarted'; }

    static get POSE_CAPTURE_FINISHED_EVENT() { return 'capturefinished'; }
}
