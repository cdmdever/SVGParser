import SVGText from '../svg/SVGText';
import Gradient from './Gradient';
import LineStyle from './LineStyle';

export default class {

	public geometryOnly(): boolean { return false; }
	public size(inWidth: number,inHeight: number): void {}
	public beginGradientFill(grad: Gradient): void {}

	public beginFill(color: number, alpha: number): void {}
	public endFill(): void {}

	public lineStyle(style: LineStyle): void {}
	public endLineStyle(): void {}

	public moveTo(inX: number, inY: number): void {}
	public lineTo(inX: number, inY: number): void {}
	public curveTo(inCX: number, inCY: number, inX: number, inY: number): void {}
	public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {}
	public rect(x: number, y: number, w: number, h: number, r: number): void {}

	public renderText(text: SVGText): void {}

	public eof(): void {}

}