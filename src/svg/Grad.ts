import Gradient from './Gradient';
import GradientType from '../gfx/GradientType';

export default class extends Gradient {

   public gradMatrix: createjs.Matrix2D = new createjs.Matrix2D();
   public radius: number = 0;
   public x1: number = 0;
   public y1: number = 0;
   public x2: number = 0;
   public y2: number = 0;

	public constructor(inType: GradientType) {
		super();
		this.type = inType;
	}

	public updateMatrix(inMatrix: createjs.Matrix2D) {
		const dx: number = this.x2 - this.x1;
		const dy: number = this.y2 - this.y1;
		const theta: number = Math.atan2(dy,dx);
		const len: number = Math.sqrt(dx * dx + dy * dy);
		const mtx = new createjs.Matrix2D();

		// mtx.createGradientBox(1.0, 1.0); // todo
		if (this.type == GradientType.LINEAR) {
			mtx.scale(len,len);
		} else {
			if (this.radius != 0) this.focus = len / this.radius;
			mtx.translate(-0.5, -0.5);
			mtx.scale(this.radius * 2, this.radius * 2);
		}

		mtx.rotate(theta);
		mtx.translate(this.x1, this.y1);
		mtx.appendMatrix(this.gradMatrix);
		mtx.appendMatrix(inMatrix);
		this.matrix = mtx;
	}

}