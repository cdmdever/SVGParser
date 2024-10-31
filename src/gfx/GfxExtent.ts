import Gfx from './Gfx';

export default class extends Gfx {

	public extent: createjs.Rectangle | null = null;

	public constructor() {
		super();
	}

	addExtent(inX: number, inY: number): void {
		if (this.extent == null) {
			this.extent = new createjs.Rectangle(inX, inY, 0, 0);
			return;
		}
		if (inX < this.extent.x) this.extent.x = inX;
		if (inX > this.extent.x + this.extent.width) this.extent.width = inX - this.extent.x;
		if (inY < this.extent.y) this.extent.y = inY;
		if (inY > this.extent.y + this.extent.height) this.extent.height = inY - this.extent.y;
	}


	public override geometryOnly(): boolean { return true; }

	public override moveTo(inX: number, inY: number): void { this.addExtent(inX, inY); }
	public override lineTo(inX: number, inY: number): void { this.addExtent(inX, inY); }

	public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
		this.addExtent(cp1x, cp1y);
		this.addExtent(cp2x, cp2y);
		this.addExtent(x, y);
	}

	public override curveTo(inCX: number, inCY: number, inX: number, inY: number): void {
		this.addExtent(inCX, inCY);
		this.addExtent(inX, inY);
	}

	public override rect(x: number, y: number, w: number, h: number, r: number): void {
		this.addExtent(x, y);
		this.addExtent(x + w, y + h);
	}

}
