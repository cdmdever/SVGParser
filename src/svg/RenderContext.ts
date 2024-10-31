export default class {

	public matrix: createjs.Matrix2D;
	public rect: createjs.Rectangle;
	public rectW: number;
	public rectH: number;

	public firstX: number = 0;
	public firstY: number = 0;
	public lastX: number = 0;
	public lastY: number = 0;

	public constructor(inMatrix: createjs.Matrix2D, inRect?: createjs.Rectangle, inW?: number, inH?: number) {
		this.matrix = inMatrix;
		this.rect = inRect;
		this.rectW = inW != null ? inW : inRect != null ? inRect.width : 1;
		this.rectH = inH != null ? inH : inRect != null ? inRect.height : 1;
	}

	public transX(inX: number, inY: number): number {
		if (this.rect != null && inX > this.rect.x) {
			if (inX > this.rect.x + this.rect.width)
				inX += this.rectW - this.rect.width;
			else
				inX = this.rect.x + this.rectW * (inX - this.rect.x) / this.rect.width;
		}
		return inX * this.matrix.a + inY * this.matrix.c + this.matrix.tx;
	}

	public transY(inX: number, inY: number): number {
		if (this.rect != null && inY > this.rect.y) {
			if (inY > this.rect.x + this.rect.width)
				inY += this.rectH - this.rect.height;
			else
				inY = this.rect.y + this.rectH * (inY - this.rect.y) / this.rect.height;
		}
		return inX * this.matrix.b + inY * this.matrix.d + this.matrix.ty;
	}

	public setLast(inX: number, inY: number): void {
		this.lastX = this.transX(inX, inY);
		this.lastY = this.transY(inX, inY);
	}

}
