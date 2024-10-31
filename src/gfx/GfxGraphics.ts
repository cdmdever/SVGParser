import Grad from '../svg/Grad';
import Gfx from './Gfx';
import GradientType from './GradientType';
import LineScaleMode from './LineScaleMode';
import LineStyle from './LineStyle';

export default class GfxGraphics extends Gfx {

	private readonly graphics: createjs.Graphics;
	private readonly colors: {color: number, command: any}[] = [];

	public constructor(inGraphics: createjs.Graphics) {
		super();
		this.graphics = inGraphics;
	}

	public replaceColor(from: number, to: number): void {
		for (const pair of this.colors) if (pair.color == from)
			pair.command.style = GfxGraphics.convertColor(to, 1);
	}

	public override beginGradientFill(g: Grad) {
		const colors: string[] = g.colors.map(GfxGraphics.convertColor);
		const ratios: number[] = g.ratios.map(v => v / 255);
		switch (g.type) {
			case GradientType.LINEAR:
				this.graphics.beginLinearGradientFill(colors, ratios, g.x1, g.y1, g.x2, g.y2);
				break;
			case GradientType.RADIAL:
				this.graphics.beginRadialGradientFill(colors, ratios, g.x1, g.y1, g.radius, g.x2, g.y2, 0);
				break;
		}
	}

	public override beginFill(color: number, alpha: number) {
		this.colors.push({ color, command: this.graphics.beginFill(GfxGraphics.convertColor(color, alpha)).command });
	}

	public override endFill() {
		this.graphics.endFill();
	}

	public override lineStyle(style: LineStyle) {
		this.colors.push({
			color: style.color, command: this.graphics.beginStroke(GfxGraphics.convertColor(style.color, style.alpha)).command
		});
		this.graphics.setStrokeStyle(
			style.thickness / 2, style.capsStyle, style.jointStyle, style.miterLimit, style.scaleMode != LineScaleMode.NONE
		);
	}
	public override endLineStyle() {
		this.graphics.endStroke();
	}

	public override moveTo(inX: number, inY: number) {
		this.graphics.mt(inX, inY);
	}

	public override lineTo(inX: number, inY: number) {
		this.graphics.lt(inX, inY);
	}

	public override curveTo(inCX: number, inCY: number, inX: number, inY: number) {
		this.graphics.curveTo(inCX, inCY, inX, inY);
	}

	public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
		this.graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
	}

	public override rect(x: number, y: number, w: number, h: number, r: number): void {
		this.graphics.drawRoundRect(x, y, w, h, r);
	}

	private static convertColor(value: number, alpha: number): string {
		return '#' + value.toString(16).padStart(6, '0') + Math.ceil(alpha * 0xFF).toString(16).padStart(2, '0');
	}

}