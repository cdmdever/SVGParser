import Grad from '../svg/Grad';
import Gfx from './Gfx';
import GradientType from './GradientType';
import LineScaleMode from './LineScaleMode';
import LineStyle from './LineStyle';

export default class GfxPoints extends Gfx {

	private readonly graphics: createjs.Graphics;
	private readonly gap: number = 10;
	private readonly radius: number = this.gap / 2;
	private prevX: number = 0;
	private prevY: number = 0;

	public constructor(inGraphics: createjs.Graphics) {
		super();
		this.graphics = inGraphics;
		this.graphics.beginFill('#000');
	}

	public override moveTo(inX: number, inY: number) {
		this.prevX = inX;
		this.prevY = inY;
	}

	public override lineTo(inX: number, inY: number) {
		// this.graphics.lt(inX, inY);
		this.moveTo(inX, inY);
	}

	public override curveTo(inCX: number, inCY: number, inX: number, inY: number) {
		this.drawPoint(this.prevX, this.prevY);
		this.moveTo(inX, inY);
	}

	private curve(t: number, p1: number, p2: number, p3: number): number {
		return Math.pow(1 - t, 2) * p1 + 2 * (1 - t) * t * p2 + Math.pow(t, 2) * p3;
	}

	private bezier(t: number, p1: number, p2: number, p3: number, p4: number): number {
		return Math.pow(1 - t, 3) * p1 + 3 * Math.pow(1 - t, 2) * t * p2 + 3 * (1 - t) * Math.pow(t, 2) * p3 + Math.pow(t, 3) * p4;
	}

	public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
		this.drawPoint(this.prevX, this.prevY);
		const tx = (t: number) => this.bezier(t, this.prevX, cp1x, cp2x, x);
		const ty = (t: number) => this.bezier(t, this.prevY, cp1y, cp2y, y);
		const ta: number[] = [0, 1];
		while (ta.length > 1) {
			const to: number = ta.pop();
			const from: number = ta.pop();
			const t: number = from + (to - from) / 2;
			const prevXFirst: number = tx(from);
			const prevYFirst: number = ty(from);
			const prevXSecond: number = tx(to);
			const prevYSecond: number = ty(to);
			const x: number = tx(t);
			const y: number = ty(t);
			const dFirst: number = Math.sqrt(Math.pow(prevXFirst - x, 2) + Math.pow(prevYFirst - y, 2));
			const dSecond: number = Math.sqrt(Math.pow(x - prevXSecond, 2) + Math.pow(y - prevYSecond, 2));
			this.drawPoint(x, y);
			if (dFirst >= this.gap) ta.push(from, t);
			if (dSecond >= this.gap) ta.push(t, to);
		}
		this.drawPoint(x, y);
		this.moveTo(x, y);
	}

	private drawPoint(x: number, y: number): void {
		this.graphics.drawCircle(x, y, this.radius);
		this.graphics.mt(x, y);
	}

	public override rect(x: number, y: number, w: number, h: number, r: number): void {
		// this.graphics.drawRoundRect(x, y, w, h, r);

		this.moveTo(x, y);
	}

	private static convertColor(value: number, alpha: number): string {
		return '#' + value.toString(16).padStart(6, '0') + Math.ceil(alpha * 0xFF).toString(16).padStart(2, '0');
	}

}