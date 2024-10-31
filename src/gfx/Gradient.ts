import SpreadMethod from './SpreadMethod';
import GradientType from './GradientType';
import InterpolationMethod from './InterpolationMethod';

export default class {

	public type: GradientType = GradientType.LINEAR;
	public colors: number[] = [];
	public alphas: number[] = [];
	public ratios: number[] = [];
	public matrix: createjs.Matrix2D = new createjs.Matrix2D();
	public spread: SpreadMethod = SpreadMethod.PAD;
	public interp: InterpolationMethod = InterpolationMethod.RGB;
	public focus: number = 0;

}