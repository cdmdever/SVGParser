import SVG from './svg/SVG';

const stageWidth = 800;
const stageHeight = 600;

window.onload = () => new class {
  readonly stage: createjs.Stage = new createjs.Stage('demoCanvas');

  readonly container: createjs.Container = new createjs.Container();

  readonly shape: createjs.Shape = new createjs.Shape();

  currentSVGIndex = 0;

  constructor() {
    this.loadNextSVG();
    this.stage.on('click', this.loadNextSVG, this);
  }

  loadNextSVG(): void {
    if (this.shape != null) this.shape.graphics.clear();
    if (++this.currentSVGIndex > 21) this.currentSVGIndex = 1;
    console.log(`Load svg: ${this.currentSVGIndex}`);
    const queue = new createjs.LoadQueue(true, '', true);
    queue.on('fileload', this.fileLoadHandler, this);
    queue.loadFile({ src: `svg/${this.currentSVGIndex}.svg`, type: 'text', crossOrigin: 'Anonymous' });
    queue.load();
  }

  fileLoadHandler(event: createjs.Event): void {
    this.stage.addChild(this.container);
    window.onresize = this.resizeHandler.bind(this);
    const data: string = event.result;
    const svg: SVG = new SVG(data);
    const sx: number = stageWidth / svg.data.width;
    const sy: number = stageHeight / svg.data.height;
    const scale: number = Math.min(sx, sy);
    this.shape.scaleX = scale;
    this.shape.scaleY = scale;
    svg.render(this.shape.graphics);

    this.container.addChild(this.shape);
    this.resizeHandler();
  }

  resizeHandler(): void {
    const canvas: HTMLCanvasElement = this.stage.canvas as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const scaleX: number = window.innerWidth / stageWidth;
    const scaleY: number = window.innerHeight / stageHeight;
    const scale: number = Math.min(scaleX, scaleY);
    this.container.scaleX = scale;
    this.container.scaleY = scale;
	// this.container.x = (window.innerWidth - stageWidth * scale) / 4;

    this.stage.update();
	
	console.log(this.container);
  }
}();
