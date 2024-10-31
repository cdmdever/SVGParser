import GfxGraphics from './gfx/GfxGraphics';
import SVG from './svg/SVG';

const stageWidth = 1024;
const stageHeight = 1024;

window.onload = () => new class {

	private readonly stage: createjs.Stage = new createjs.Stage('demoCanvas');
	private readonly container: createjs.Container = new createjs.Container();
	private readonly shape: createjs.Shape = new createjs.Shape();

	private currentSVGIndex: number = 0;
	private gfx: GfxGraphics | null = null;

	constructor() {
		this.loadNextSVG();
		this.stage.on('click', this.loadNextSVG, this);
		// @ts-ignore
		window.stage = this.stage;
		setInterval(this.updateColors.bind(this), 2000);
	}

	private updateColors(): void {
		if (this.gfx != null) {
			this.gfx.replaceColor(0xf4aa97, Math.ceil(Math.random() * 0xFFFFFF)); //#f4aa97
			this.gfx.replaceColor(0x222222, Math.ceil(Math.random() * 0xFFFFFF)); //#222222
			this.gfx.replaceColor(0x332c2b, Math.ceil(Math.random() * 0xFFFFFF)); //#332c2b
			this.stage.update();
		}
	}

	private loadNextSVG(): void {
		this.gfx = null;
		if (this.shape != null) this.shape.graphics.clear();
		if (++this.currentSVGIndex > 34) this.currentSVGIndex = 1;
		console.log('Load svg: ' + this.currentSVGIndex);
		const queue = new createjs.LoadQueue(true, '', true);
		queue.on('fileload', this.fileLoadHandler, this);
		queue.loadFile({src: `svg/old-svgs/${this.currentSVGIndex}.svg`, type: 'text', crossOrigin: 'Anonymous'});
		queue.load();
	}

	private fileLoadHandler(event: createjs.Event): void {
		this.stage.addChild(this.container);
		window.onresize = this.resizeHandler.bind(this);
		const data: string = event.result;
		const svg: SVG = new SVG(data);
		const sx: number = stageWidth / svg.data.width;
		const sy: number = stageHeight / svg.data.height;
		const scale: number = Math.min(sx, sy);
		this.shape.scaleX = scale;
		this.shape.scaleY = scale;
		this.gfx = svg.render(this.shape.graphics);
		this.container.addChild(this.shape);
		this.resizeHandler();
	}

	private resizeHandler(): void {
		const canvas: HTMLCanvasElement = this.stage.canvas as HTMLCanvasElement;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		const scaleX: number = window.innerWidth / stageWidth;
		const scaleY: number = window.innerHeight / stageHeight;
		const scale: number = Math.min(scaleX, scaleY);
		this.container.scaleX = scale;
		this.container.scaleY = scale;
		this.stage.update();
	}

};