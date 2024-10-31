import Gfx from '../gfx/Gfx';
import GfxExtent from '../gfx/GfxExtent';
import GfxGraphics from '../gfx/GfxGraphics';
import GfxPoints from '../gfx/GfxPoints';
import GfxTextFinder from '../gfx/GfxTextFinder';
import LineStyle from '../gfx/LineStyle';
import { FillTypeType } from './FillType';
import Grad from './Grad';
import { DisplayElementType, Group } from './Group';
import Path from './Path';
import RenderContext from './RenderContext';
import SVGData from './SVGData';
import SVGText from './SVGText';

type GroupPath = string[];
type ObjectFilter = (s: string, g: GroupPath) => boolean;

export default class SVGRenderer {

	public static readonly SQRT2: number = Math.sqrt(2);
	public readonly width: number;
	public readonly height: number;

	private readonly mSvg: SVGData;
	private mRoot: Group;
	private mGfx: Gfx;
	private mMatrix: createjs.Matrix2D;
	private mScaleRect: createjs.Rectangle;
	private mScaleW: number | null = null;
	private mScaleH: number | null = null;
	private mFilter: ObjectFilter;
	private mGroupPath: GroupPath;

	public constructor(inSvg: SVGData, inLayer?: string) {
		this.mSvg = inSvg;
		this.width = this.mSvg.width;
		this.height = this.mSvg.height;
		this.mRoot = this.mSvg;
		if (inLayer != null) {
			this.mRoot = this.mSvg.findGroup(inLayer);
			if (this.mRoot == null) throw new Error('Could not find SVG group: ' + inLayer);
		}
	}

	public iterate<T extends Gfx>(inGfx: T, inFilter?: ObjectFilter): T {
		this.mGfx = inGfx;
		this.mMatrix = new createjs.Matrix2D();
		this.mFilter = inFilter;
		this.mGroupPath = [];
		this.mGfx.size(this.width, this.height);
		this.iterateGroup(this.mRoot, true);
		this.mGfx.eof();
		return inGfx;
	}

	public hasGroup(inName: string): boolean { return this.mRoot.hasGroup(inName); }

	public iterateText(inText: SVGText): void {
		if (this.mFilter != null && !this.mFilter(inText.name, this.mGroupPath)) return;
		this.mGfx.renderText(inText);
	}

	public iteratePath(inPath: Path): void {
		if (this.mFilter != null && !this.mFilter(inPath.name, this.mGroupPath)) return;
		if (inPath.segments.length == 0 || this.mGfx == null) return;
		const m: createjs.Matrix2D = inPath.matrix.clone();
		m.appendMatrix(this.mMatrix);
		const context: RenderContext = new RenderContext(m, this.mScaleRect, this.mScaleW, this.mScaleH);
		const geomOnly: boolean = this.mGfx.geometryOnly();
		if (!geomOnly) {
			// Move to avoid the case of:
			//  1. finish drawing line on last path
			//  2. set fill=something
			//  3. move (this draws in the fill)
			//  4. continue with "real" drawing
			inPath.segments[0].toGfx(this.mGfx, context);
			switch (inPath.fill.type) {
				case FillTypeType.FillGrad:
					const grad: Grad = inPath.fill.grad;
					grad.updateMatrix(m);
					this.mGfx.beginGradientFill(grad);
					break;
				case FillTypeType.FillSolid:
					this.mGfx.beginFill(inPath.fill.color, inPath.fill_alpha * inPath.alpha);
					break;
				case FillTypeType.FillNone:
					// mGfx.endFill();
					break;
			}
			if (inPath.stroke_colour == null) {
				// mGfx.lineStyle();
			} else {
				const style: LineStyle = new LineStyle();
				const scale: number = Math.sqrt(m.a * m.a + m.d * m.d) / SVGRenderer.SQRT2;
				style.thickness = inPath.stroke_width * scale;
				style.alpha = inPath.stroke_alpha * inPath.alpha;
				style.color = inPath.stroke_colour;
				style.capsStyle = inPath.stroke_caps;
				style.jointStyle = inPath.joint_style;
				style.miterLimit = inPath.miter_limit;
				this.mGfx.lineStyle(style);
			}
		}

		for (const segment of inPath.segments) {
			segment.toGfx(this.mGfx, context);
		}
		// endFill automatically close an open path
		// by putting endLineStyle before endFill, the closing line is not drawn
		// so an open path in inkscape stay open in openfl
		// this does not affect closed path
		this.mGfx.endLineStyle();
		this.mGfx.endFill();
	}

	public iterateGroup(inGroup: Group, inIgnoreDot: boolean): void {
		// Convention for hidden layers ...
		if (inIgnoreDot && inGroup.name != null && inGroup.name.substr(0, 1) == ".") return;
		this.mGroupPath.push(inGroup.name);
		// if (mFilter!=null && !mFilter(inGroup.name)) return;
		for (const child of inGroup.children) switch (child.type) {
			case DisplayElementType.DisplayGroup: this.iterateGroup(child.group, inIgnoreDot); break;
			case DisplayElementType.DisplayPath: this.iteratePath(child.path); break;
			case DisplayElementType.DisplayText: this.iterateText(child.text); break;
		}
		this.mGroupPath.pop();
	}

	public render(
		inGfx: createjs.Graphics, inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter,
		inScaleRect?: createjs.Rectangle, inScaleW?: number, inScaleH?: number
	): GfxGraphics {
		const gfx: GfxGraphics = new GfxGraphics(inGfx);
		this.mGfx = gfx;
		this.mMatrix = inMatrix == null ? new createjs.Matrix2D() : inMatrix.clone();
		this.mScaleRect = inScaleRect;
		this.mScaleW = inScaleW;
		this.mScaleH = inScaleH;
		this.mFilter = inFilter;
		this.mGroupPath = [];
		this.iterateGroup(this.mRoot, inFilter == null);
		return gfx;
	}

	public renderPoints(
		inGfx: createjs.Graphics, inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter,
		inScaleRect?: createjs.Rectangle, inScaleW?: number, inScaleH?: number
	): void {
		this.mGfx = new GfxPoints(inGfx);
		this.mMatrix = inMatrix == null ? new createjs.Matrix2D() : inMatrix.clone();
		this.mScaleRect = inScaleRect;
		this.mScaleW = inScaleW;
		this.mScaleH = inScaleH;
		this.mFilter = inFilter;
		this.mGroupPath = [];
		this.iterateGroup(this.mRoot, inFilter == null);
	}

	public renderRect(
		inGfx: createjs.Graphics, inFilter: ObjectFilter, scaleRect: createjs.Rectangle,
		inBounds: createjs.Rectangle, inRect: createjs.Rectangle
	): void {
		const matrix: createjs.Matrix2D = new createjs.Matrix2D();
		matrix.tx = inRect.x - (inBounds.x);
		matrix.ty = inRect.y - (inBounds.y);
		if (scaleRect != null) {
			const extraX: number = inRect.width - (inBounds.width - scaleRect.width);
			const extraY: number = inRect.height - (inBounds.height - scaleRect.height);
			this.render(inGfx, matrix, inFilter, scaleRect, extraX, extraY);
		}
		else
			this.render(inGfx, matrix, inFilter);
	}

	public renderRect0(
		inGfx: createjs.Graphics, inFilter: ObjectFilter, scaleRect: createjs.Rectangle,
		inBounds: createjs.Rectangle, inRect: createjs.Rectangle
	): void {
		const matrix: createjs.Matrix2D = new createjs.Matrix2D();
		matrix.tx = -(inBounds.x);
		matrix.ty = -(inBounds.y);
		if (scaleRect != null) {
			const extraX: number = inRect.width - (inBounds.width - scaleRect.width);
			const extraY: number = inRect.height - (inBounds.height - scaleRect.height);
			this.render(inGfx, matrix, inFilter, scaleRect, extraX, extraY);
		}
		else
			this.render(inGfx, matrix, inFilter);
	}

	public getExtent(inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter, inIgnoreDot?: boolean): createjs.Rectangle {
		if (inIgnoreDot == null) inIgnoreDot = inFilter == null;
		const gfx: GfxExtent = new GfxExtent();
		this.mGfx = gfx;
		this.mMatrix = inMatrix == null ? new createjs.Matrix2D() : inMatrix.clone();
		this.mFilter = inFilter;
		this.mGroupPath = [];
		this.iterateGroup(this.mRoot, inIgnoreDot);
		return gfx.extent;
	}

	public findText(inFilter?: ObjectFilter): SVGText {
		this.mFilter = inFilter;
		this.mGroupPath = [];
		const finder: GfxTextFinder = new GfxTextFinder();
		this.mGfx = finder;
		this.iterateGroup(this.mRoot, false);
		return finder.text;
	}

	public getMatchingRect(inMatch: RegExp): createjs.Rectangle {
		return this.getExtent(null, (_, groups) => groups[1] != null && inMatch.test(groups[1]), false);
	}

	public renderObject(
		inObj: createjs.DisplayObject, inGfx: createjs.Graphics,
		inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter, inScale9?: createjs.Rectangle
	): void {
		this.render(inGfx, inMatrix, inFilter, inScale9);
		const rect: createjs.Rectangle = this.getExtent(inMatrix, (_, groups) => groups[1] == '.scale9', false);
		// todo
	}

	public renderSprite(
		inObj: createjs.Sprite, inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter, inScale9?: createjs.Rectangle
	): void {
		// this.renderObject(inObj, inObj.graphics, inMatrix, inFilter, inScale9); // todo
	}

	public createShape(inMatrix?: createjs.Matrix2D, inFilter?: ObjectFilter, inScale9?: createjs.Rectangle): createjs.Shape {
		const shape: createjs.Shape = new createjs.Shape();
		this.renderObject(shape, shape.graphics, inMatrix, inFilter, inScale9);
		return shape;
	}

	public namedShape(inName: string): createjs.Shape {
		return this.createShape(null, (name, _) => name == inName);
	}

	public renderBitmap(inRect?: createjs.Rectangle, inScale: number = 1.0) {
		this.mMatrix = new createjs.Matrix2D(inScale, 0, 0, inScale, -inRect.x * inScale, -inRect.y * inScale);
		const w: number = Math.ceil(inRect == null ? this.width : inRect.width * inScale);
		const h: number = Math.ceil(inRect == null ? this.height : inRect.height * inScale);
		// todo
	}

}