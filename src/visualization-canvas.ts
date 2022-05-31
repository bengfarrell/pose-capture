import { Bounds } from './baseplayer';
import { AbstractPoseVisualizer } from './abstractvisualizer';
import { Keyframe, Point } from './videopose-element';

export class VisualizationCanvas extends HTMLElement implements AbstractPoseVisualizer {
    static get observedAttributes() {
        return ['dotsize', 'dotcolor', 'dotbackcolor']
    }

    /**
     * dot size in pixels
     */
    public dotSize = 2;

    /**
     * dot color
     */
    public dotColor = '#ff0000';

    /**
     * dot back color (if depth is provided, gradiate between the primary dot color in the
     * forefront and this back color at the farthest away
     */
    public dotBackColor?: string;

    public canvas?: HTMLCanvasElement | null;

    public canvasContext?: CanvasRenderingContext2D | null;

    public offsetX: number = 0;

    public offsetY: number = 0;

    clear() {
        if (this.canvas && this.canvasContext) {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    resize() {
        this.clear();
        this.canvasContext = null;
    }

    draw(frames: Keyframe[], bounds: Bounds) {
        if (!this.canvas || !this.canvasContext || this.canvas.width !== bounds.width || this.canvas.height !== bounds.height) {
            this.canvas = this.shadowRoot?.querySelector('canvas');
            if (this.canvas) {
                this.canvas.style.left = `${bounds.x}px`;
                this.canvas.style.top = `${bounds.y}px`;
                this.canvas.width = bounds.width;
                this.canvas.height = bounds.height;
                this.offsetX = bounds.x;
                this.offsetY = bounds.y;
                this.canvasContext = this.canvas.getContext('2d');
            }
        }

        if (this.canvasContext && this.canvas) {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasContext.fillStyle = this.dotColor;
            frames.forEach((frame: Keyframe) => {
                frame.points.forEach((point: Point) => {
                    const centerX = point.position[0] * (this.canvas?.width || 0);
                    const centerY = point.position[1] * (this.canvas?.height || 0);

                    // Maybe make the below range configurable?
                    if (/*frame.bounds.maxZ && frame.bounds.minZ &&*/ this.dotBackColor) {
                        const depthRange = 1; // frame.bounds.maxZ - frame.bounds.minZ;
                        const colordiff = ( point.position[2] / depthRange );
                        const color = VisualizationCanvas.InterpolateColor(this.dotColor, this.dotBackColor, colordiff);
                        if (this.canvasContext) {
                            this.canvasContext.fillStyle = color;
                        }
                    }
                    this.canvasContext?.beginPath();
                    this.canvasContext?.arc(centerX, centerY, this.dotSize, 0, 2 * Math.PI, false);
                    this.canvasContext?.fill();
                });
            });
        }
    }

    drawKeyframe(key: Keyframe) {
        key.points.forEach((point: Point) => {
            const centerX = point.position[0] * (this.canvas?.width || 0);
            const centerY = point.position[1] * (this.canvas?.height || 0);
            this.canvasContext?.beginPath();
            this.canvasContext?.arc(centerX, centerY, this.dotSize, 0, 2 * Math.PI, false);
            this.canvasContext?.fill();
        });
    }

    constructor() {
        super();

        this.offsetX = 0;
        this.offsetY = 0;

        this.attachShadow( { mode: 'open' } );
        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }

                canvas {
                    position: relative;
                }
            </style>
            <canvas></canvas>`;
        }
    }

    protected async attributeChangedCallback(name: string, _oldval: any, newval: any) {
        switch (name) {
            case 'dotsize':
                this.dotSize = newval;
                break;

            case 'dotcolor':
                this.dotColor = newval;
                break;

            case 'dotbackcolor':
                this.dotBackColor = newval;
                break;

            default:
                break;
        }
    }

    protected static AdjustColorBrightness(col: string, amt: number) {
        const num = parseInt(col, 16);
        const r = (num >> 16) + amt;
        const b = ((num >> 8) & 0x00FF) + amt;
        const g = (num & 0x0000FF) + amt;
        const newColor = g | (b << 8) | (r << 16);
        return newColor.toString(16);
    }

    protected static InterpolateColor(c0: string, c1: string, f: number) {
        const mc0 = c0.substr(1, c0.length).match(/.{1,2}/g)?.map((oct)=>parseInt(oct, 16) * (1-f));
        const mc1 = c1.substr(1, c1.length).match(/.{1,2}/g)?.map((oct)=>parseInt(oct, 16) * f);
        if (mc0 && mc1) {
            let ci = [0, 1, 2].map(i => Math.min(Math.round(mc0[i] + mc1[i]), 255));
            return `#${ci.reduce((a, v) => ((a << 8) + v), 0).toString(16).padStart(6, "0")}`;
        } else {
            return '#000000';
        }
    }
}

customElements.define('visualization-canvas', VisualizationCanvas);
