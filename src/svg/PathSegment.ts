import Gfx from '../gfx/Gfx';
import RenderContext from './RenderContext';

export class PathSegment {

	public static MOVE: number  = 1;
	public static DRAW: number  = 2;
	public static CURVE: number = 3;
	public static CUBIC: number = 4;
	public static ARC: number   = 5;
	public static RECT: number  = 6;

	public x: number;
	public y: number;

	public constructor(inX: number, inY: number) {
		this.x = inX;
		this.y = inY;
	}

	public getType(): number { return 0; }

	public prevX() { return this.x; }
	public prevY() { return this.y; }
	public prevCX() { return this.x; }
	public prevCY() { return this.y; }

	public toGfx(inGfx: Gfx, ioContext: RenderContext): void {
		ioContext.setLast(this.x, this.y);
		ioContext.firstX = ioContext.lastX;
		ioContext.firstY = ioContext.lastY;
		inGfx.moveTo(ioContext.lastX, ioContext.lastY);
	}

}

export class MoveSegment extends PathSegment {

	public constructor(inX: number, inY: number) { super(inX, inY); }

	public override getType(): number { return PathSegment.MOVE; }

}

export class DrawSegment extends PathSegment {

	public constructor(inX: number, inY: number) { super(inX,inY); }

	public override toGfx(inGfx: Gfx, ioContext: RenderContext): void {

		// POINTS
		// inGfx.endFill();
		// inGfx.beginFill(0x445566, 1);

		// const gap = 10;
		// const r = gap / 2;
		// const px = ioContext.lastX;
		// const py = ioContext.lastY;
		// inGfx.rect(px, py, gap, gap, r);

		// ioContext.setLast(ioContext.lastX,ioContext.lastY);

		// inGfx.moveTo(px, py);

		// console.log('!!!!!!!!!!!!!!');
		// END POINTS
		// inGfx.lineStyle({color: 0xFF4444, alpha: 1, capsStyle: 0, jointStyle: 0, miterLimit: 3, pixelHinting: false, scaleMode: 0, thickness: 3});


		ioContext.setLast(this.x, this.y);
		inGfx.lineTo(ioContext.lastX,ioContext.lastY);
	}

	public override getType() : number { return PathSegment.DRAW; }

}

export class QuadraticSegment extends PathSegment {

	public cx: number;
	public cy: number;

	public constructor(inCX: number, inCY: number, inX: number, inY: number) {
		super(inX,inY);
		this.cx = inCX;
		this.cy = inCY;
	}

	public override prevCX() { return this.cx; }
	public override prevCY() { return this.cy; }

	public override toGfx(inGfx: Gfx, ioContext: RenderContext): void {
		ioContext.setLast(this.x, this.y);
		inGfx.curveTo(ioContext.transX(this.cx, this.cy) , ioContext.transY(this.cx, this.cy), ioContext.lastX , ioContext.lastY);
	}

	public override getType(): number { return PathSegment.CURVE; }

}

export class CubicSegment extends PathSegment {

	public cx1: number;
	public cy1: number;
	public cx2: number;
	public cy2: number;

	public constructor(inCX1: number, inCY1: number, inCX2: number, inCY2: number, inX: number, inY: number) {
		super(inX,inY);
		this.cx1 = inCX1;
		this.cy1 = inCY1;
		this.cx2 = inCX2;
		this.cy2 = inCY2;
	}

	public override prevCX() { return this.cx2; }
	public override prevCY() { return this.cy2; }

	private interp(a: number, b: number, frac: number) { return a + (b - a) * frac; }

	public override toGfx(inGfx: Gfx, ioContext: RenderContext): void {
		// Transformed endpoints / control points
		const tx1: number = ioContext.transX(this.cx1, this.cy1);
		const ty1: number = ioContext.transY(this.cx1, this.cy1);
		const tx2: number = ioContext.transX(this.cx2, this.cy2);
		const ty2: number = ioContext.transY(this.cx2, this.cy2);

		ioContext.setLast(this.x, this.y);
		const tx3: number = ioContext.lastX;
		const ty3: number = ioContext.lastY;

		inGfx.bezierCurveTo(tx1, ty1, tx2, ty2, tx3, ty3);
	}

	public toQuadratics(tx0: number,ty0: number): QuadraticSegment[] {
		const result: QuadraticSegment[] = [];
		// from http://www.timotheegroleau.com/Flash/articles/cubic_bezier/bezier_lib.as

		const pa_x: number = this.interp(tx0, this.cx1, 0.75);
		const pa_y: number = this.interp(ty0, this.cy1, 0.75);
		const pb_x: number = this.interp(this.x, this.cx2, 0.75);
		const pb_y: number = this.interp(this.y, this.cy2, 0.75);

		// get 1/16 of the [P3, P0] segment
		const dx: number = (this.x - tx0) / 16;
		const dy: number = (this.y - ty0) / 16;

		// calculates control point 1
		const pcx_1: number = this.interp(tx0, this.cx1, 3 / 8);
		const pcy_1: number = this.interp(ty0, this.cy1, 3 / 8);

		// calculates control point 2
		const pcx_2: number = this.interp(pa_x, pb_x, 3 / 8) - dx;
		const pcy_2: number = this.interp(pa_y, pb_y, 3 / 8) - dy;

		// calculates control point 3
		const pcx_3: number = this.interp(pb_x, pa_x, 3 / 8) + dx;
		const pcy_3: number = this.interp(pb_y, pa_y, 3 / 8) + dy;

		// calculates control point 4
		const pcx_4: number = this.interp(this.x, this.cx2, 3 / 8);
		const pcy_4: number = this.interp(this.y, this.cy2, 3 / 8);

		// calculates the 3 anchor points
		const pax_1: number = (pcx_1 + pcx_2) * 0.5;
		const pay_1: number = (pcy_1 + pcy_2) * 0.5;

		const pax_2: number = (pa_x + pb_x) * 0.5;
		const pay_2: number = (pa_y + pb_y) * 0.5;

		const pax_3: number = (pcx_3 + pcx_4) * 0.5;
		const pay_3: number = (pcy_3 + pcy_4) * 0.5;

		// draw the four quadratic subsegments
		result.push(new QuadraticSegment(pcx_1, pcy_1, pax_1, pay_1));
		result.push(new QuadraticSegment(pcx_2, pcy_2, pax_2, pay_2));
		result.push(new QuadraticSegment(pcx_3, pcy_3, pax_3, pay_3));
		result.push(new QuadraticSegment(pcx_4, pcy_4, this.x, this.y));
		return result;
	}

	public override getType(): number { return PathSegment.CUBIC; }

}

export class ArcSegment extends PathSegment {

	private x1: number;
	private y1: number;
	private rx: number;
	private ry: number;
	private phi: number;
	private fA: boolean;
	private fS: boolean;

	public constructor(
		inX1:number, inY1:number, inRX:number, inRY:number, inRotation:number, inLargeArc:boolean, inSweep:boolean, x:number, y:number
	) {
		super(x,y);
		this.x1 = inX1;
		this.y1 = inY1;
		this.rx = inRX;
		this.ry = inRY;
		this.phi = inRotation;
		this.fA = inLargeArc;
		this.fS = inSweep;
	}

	public override toGfx(inGfx: Gfx, ioContext: RenderContext): void {
		if (this.x1 == this.x && this.y1 == this.y) return;

		// inGfx.lineStyle({color: 0xFF4444, alpha: 1, capsStyle: 0, jointStyle: 0, miterLimit: 3, pixelHinting: false, scaleMode: 0, thickness: 3});

		// inGfx.endFill();
		// inGfx.beginFill(0x664444, 1);

		// const gap = 10;
		// const r = gap / 2;
		// inGfx.rect(ioContext.lastX, ioContext.lastX, gap, gap, r);

		// // ioContext.setLast(this.x, this.y);

		// // inGfx.rect(ioContext.lastX, ioContext.lastX, gap, gap, r);

		// // inGfx.moveTo(ioContext.lastX, ioContext.lastX);

		// // return;

		ioContext.setLast(this.x, this.y);
		if (this.rx == 0 || this.ry == 0) {
			inGfx.lineTo(ioContext.lastX, ioContext.lastY);
			return;
		}
		if (this.rx < 0) this.rx = -this.rx;
		if (this.ry < 0) this.ry = -this.ry;

		// See:  http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
		const p: number = this.phi*Math.PI/180.0;
		const cos: number = Math.cos(p);
		const sin: number = Math.sin(p);

		// Step 1, compute x', y'
		const dx: number = (this.x1 - this.x) * 0.5;
		const dy: number = (this.y1 - this.y) * 0.5;
		const x1_: number = cos * dx + sin * dy;
		const y1_: number = -sin * dx + cos * dy;

		// Step 2, compute cx', cy'
		const rx2: number = this.rx * this.rx;
		const ry2: number = this.ry * this.ry;
		const x1_2: number = x1_ * x1_;
		const y1_2: number = y1_ * y1_;
		let s: number = (rx2 * ry2 - rx2 * y1_2 - ry2 * x1_2) / (rx2 * y1_2 + ry2 * x1_2);
		if (s < 0)
			s = 0;
		else if (this.fA == this.fS)
			s = -Math.sqrt(s);
		else
			s = Math.sqrt(s);

		const cx_: number = s * this.rx * y1_ / this.ry;
		const cy_: number = -s * this.ry * x1_ / this.rx;

		// Step 3, compute cx,cy from cx',cy'
		// Something not quite right here.

		const xm: number = (this.x1 + this.x) * 0.5;
		const ym: number = (this.y1 + this.y) * 0.5;

		const cx: number = cos * cx_ - sin * cy_ + xm;
		const cy: number = sin * cx_ + cos * cy_ + ym;

		let theta: number = Math.atan2( (y1_ - cy_) / this.ry, (x1_ - cx_) / this.rx );
		let dtheta: number = Math.atan2( (-y1_ - cy_) / this.ry, (-x1_ - cx_) / this.rx ) - theta;

		if (this.fS && dtheta < 0)
			dtheta += 2.0 * Math.PI;
		else if (!this.fS && dtheta > 0)
			dtheta -= 2.0 * Math.PI;

		const m: createjs.Matrix2D = ioContext.matrix;
		//    let px = cx+cos*rx;
		//    let py = cy+sin*ry;
		//    m.a*px+m.c*py+m.tx    m.b*px+m.d*py+m.ty
		//  Combined
		//    x = m.a(cx+cos*rx) + m.c(cy+sin*ry) + m.tx
		//      = m.a*rx * cos +  m.c*ry*sin + m.a*cx+m.c*cy + m.tx
		//      = Txc cos +  Txc sin + Tx0
		//    y = m.b(cx+cos*rx) + m.d(cy+sin*ry) + m.ty
		//      = m.b*rx * cos +  m.d*ry*sin + m.b*cx+m.d*cy + m.ty
		//      = Tyc cos +  Tys sin + Ty0
		//

		let Txc: number;
		let Txs: number;
		let Tx0: number;
		let Tyc: number;
		let Tys: number;
		let Ty0: number;
		if (m != null) {
			Txc = m.a * this.rx;
			Txs = m.c * this.ry;
			Tx0 = m.a * cx + m.c * cy + m.tx;
			Tyc = m.b * this.rx;
			Tys = m.d * this.ry;
			Ty0 = m.b * cx + m.d * cy + m.ty;
		} else {
			Txc = this.rx;
			Txs = 0;
			Tx0 = cx + m.tx;
			Tyc = 0;
			Tys = this.ry;
			Ty0 = cy + m.ty;
		}

		// POINTS
		let prevX: number = null;
		let prevY: number = null;
		// END POINT

		let len = Math.abs(dtheta) * Math.sqrt(Txc * Txc + Txs * Txs + Tyc * Tyc + Tys * Tys);
		// TODO: Do as series of quadratics ...
		len *= 5;
		let steps = Math.round(len);
		if (steps > 1) {
			dtheta /= steps;
			for (let i: number = 0; i < steps - 1; i++) {
				let c: number = Math.cos(theta);
				let s: number = Math.sin(theta);
				theta += dtheta;
				const x: number = Txc * c + Txs * s + Tx0;
				const y: number = Tyc * c + Tys * s + Ty0;
				inGfx.lineTo(x, y);

				// POINTS
				// const gap = 10;
				// if (prevX != null && prevY != null) {
				// 	const d = Math.sqrt(Math.pow(prevX - x, 2) + Math.pow(prevY - y, 2));
				// 	if (d < gap) continue;
				// }
				// prevX = x;
				// prevY = y;

				// inGfx.endFill();
				// inGfx.beginFill(0x004444, 1);

				// const r = gap / 2;
				// inGfx.rect(x, y, gap, gap, r);
				//END POINTS
			}
		}
		inGfx.lineTo(ioContext.lastX, ioContext.lastY);
	}

	public override getType(): number { return PathSegment.ARC; }

}

export class RectSegment extends PathSegment {

	private w: number;
	private h: number;
	private rx: number | null;
	private ry: number | null;

	public constructor(x: number, y: number, w: number, h: number, rx: number | null, ry: number | null) {
		super(x, y);
		this.w = w + 1;
		this.h = h + 1;
		this.rx = rx;
		this.ry = ry;
	}

	public override getType(): number { return PathSegment.RECT; }

	/**
	 * QuadraticSegment
	 */
	private q(inGfx: Gfx, ioContext: RenderContext, cx: number, cy: number, inX: number, inY: number): void {
		inGfx.curveTo(ioContext.transX(cx, cy), ioContext.transY(cx, cy), ioContext.transX(inX, inY), ioContext.transY(inX, inY));
	}

	/**
	 * DrawSegment
	 */
	private d(inGfx: Gfx, ioContext: RenderContext, inX: number, inY: number): void {
		inGfx.lineTo(ioContext.transX(inX, inY), ioContext.transY(inX, inY));
	}

	/**
	 * MoveSegment
	 */
	private m(inGfx: Gfx, ioContext: RenderContext, inX: number, inY: number): void {
		inGfx.moveTo(ioContext.transX(inX, inY), ioContext.transY(inX, inY));
	}

	public override toGfx(inGfx: Gfx, ioContext: RenderContext): void {
		ioContext.setLast(this.x, this.y);
		if (this.rx == null && this.ry == null) {
			inGfx.rect(this.x, this.y, this.w, this.h, 0);
		} else {
			const rx: number = this.rx ?? this.ry;
			const ry: number = this.ry ?? this.rx;
			if (rx == ry) {
				inGfx.rect(this.x, this.y, this.w, this.h, this.rx);
			} else {
				const x: number = this.x;
				const y: number = this.y;
				const w: number = this.w;
				const h: number = this.h;
				this.m(inGfx, ioContext, x, y + ry);

				// top-left
				this.q(inGfx, ioContext, x, y, x + rx, y);
				this.d(inGfx, ioContext, x + w - rx, y);

				// top-right
				this.q(inGfx, ioContext, x + w, y, x + w, y + ry);
				this.d(inGfx, ioContext, x + w, y + h - ry);

				// bottom-right
				this.q(inGfx, ioContext, x + w, y + h, x + w - rx, y + h);
				this.d(inGfx, ioContext, x + rx, y + h);

				// bottom-left
				this.q(inGfx, ioContext, x, y + h, x, y + h - ry);
				this.d(inGfx, ioContext, x, y + ry);
			}
		}

	}

}