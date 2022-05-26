import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../poseplayer';
// import '../facelandmark-video';
import '../bodypix-video';
import '../visualization-canvas';
import '../ui/playbackcontrols';

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

    public render() {
        return html`<bodypix-video id="video" camera>
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
