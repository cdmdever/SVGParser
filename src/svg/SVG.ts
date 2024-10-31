import GfxGraphics from '../gfx/GfxGraphics';
import SVGData from './SVGData';
import SVGRenderer from './SVGRenderer';

export default class {

	public readonly data: SVGData;

	public constructor(content: string) {
		this.data = new SVGData(new DOMParser().parseFromString(content, 'image/svg+xml'));
	}

	public render(
		graphics: createjs.Graphics, x: number = 0, y: number = 0, width: number = -1, height: number = -1, inLayer: string = null
	): GfxGraphics {
		const matrix: createjs.Matrix2D = new createjs.Matrix2D();
		matrix.identity();
		if (width > -1 && height > -1) matrix.scale(width / this.data.width, height / this.data.height);

		matrix.translate(x, y);
		const renderer: SVGRenderer = new SVGRenderer(this.data, inLayer);
		const gfx: GfxGraphics = renderer.render(graphics, matrix);
		// renderer.renderPoints(graphics, matrix);
		return gfx;
	}

}