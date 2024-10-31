import SVGText from '../svg/SVGText';
import Gfx from './Gfx';

export default class extends Gfx {

	public text: SVGText;

	public constructor() { super(); }

	public override geometryOnly() { return true; }
	public override renderText(inText: SVGText) { if (this.text == null) this.text = inText; }

}