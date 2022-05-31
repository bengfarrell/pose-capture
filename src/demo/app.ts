import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../poseplayer';
// import '../facelandmark-video';
import '../bodypix-video';
import '../visualization-canvas';
import '../ui/playbackcontrols';
import {VideoPoseBase} from "../videopose-element";

@customElement('pose-demo-app')
export class DemoApp extends LitElement {
    static styles = css`
        :host {
          width: 640px;
          height: 480px;
          display: inline-block;
        }
      
        #video {
          width: 100%;
          height: 100%;
          display: inline-block;
          background-color: #333333;
        }
    `;

    protected onRecordingFinished(e: Event) {
        console.log((e.target as VideoPoseBase).recording)
        const link = document.createElement('a');
        const data = `data:text/json;charset=utf-8,${
            encodeURIComponent( JSON.stringify(
                (e.target as VideoPoseBase).recording)
            )}`;
        link.setAttribute('download', 'posedata.json');
        link.setAttribute('href', data);
        link.click();
    }

    public render() {
        return html`
            <bodypix-video 
                id="video" xcamera source="./sampleassets/conan.mp4" 
                @endrecording=${this.onRecordingFinished}>
            <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
            <pose-playback-controls></pose-playback-controls>
        </bodypix-video>`;
    }

    public renderPosePlayer() {
        return html`<pose-player id="video" autoplay isLooping posedata="./sampleassets/posedata.json">
            <visualization-canvas dotcolor="#ff0000" dotbackcolor="#000000"></visualization-canvas>
            <pose-playback-controls></pose-playback-controls>
        </pose-player>`;
    }
}
