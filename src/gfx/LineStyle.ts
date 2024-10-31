import CapsStyle from './CapsStyle';
import JointStyle from './JointStyle';
import LineScaleMode from './LineScaleMode';

export default class {

	public thickness: number = 1.0;
	public color: number = 0x000000;
	public alpha: number = 1.0;
	public pixelHinting: boolean = false;
	public scaleMode: LineScaleMode = LineScaleMode.NORMAL;
	public capsStyle: CapsStyle = CapsStyle.ROUND;
	public jointStyle: JointStyle = JointStyle.ROUND;
	public miterLimit: number = 3.0;

}