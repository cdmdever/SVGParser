import CapsStyle from '../gfx/CapsStyle';
import GradientType from '../gfx/GradientType';
import JointStyle from '../gfx/JointStyle';
import { FillType, FillTypeType } from './FillType';
import Grad from './Grad';
import { DisplayElement, DisplayElementType, Group } from './Group';
import Path from './Path';
import PathParser from './PathParser';
import { DrawSegment, MoveSegment, QuadraticSegment, RectSegment } from './PathSegment';
import SVGText from './SVGText';

export default class SVGData extends Group {

	private static SIN45: number = 0.70710678118654752440084436210485;
	private static TAN22: number = 0.4142135623730950488016887242097;
	private static mStyleSplit: string = ';';
	private static mStyleValue: RegExp = /\s*(.*)\s*:\s*(.*)\s*/;
	private static mTranslateMatch: RegExp = /translate\((-?\d+\.?\d*)[,\s+](-?\d+\.?\d*)\)/;
	private static mScaleMatch: RegExp = /scale\((.*)\)/;
	private static mMatrixMatch: RegExp = /matrix\((.*?)[, ]+(.*?)[, ]+(.*?)[, ]+(.*?)[, ]+(.*?)[, ]+(.*?)\)/;
	private static mRotationMatch: RegExp = /rotate\((-?\d+\.?\d*)(?:\s+(-?\d+\.?\d*))?(?:\s+(-?\d+\.?\d*))?\)/;
	private static mURLMatch: RegExp = /url\(#(.*)\)/;
	private static mRGBMatch: RegExp = /rgb\s*\(\s*(\d+)\s*(%)?\s*,\s*(\d+)\s*(%)?\s*,\s*(\d+)\s*(%)?\s*\)/;
	private static defaultFill: FillType = FillType.createFillSolid(0x000000);

	public readonly width: number;
	public readonly height: number;

	private mConvertCubics: boolean;
	private mGrads: Map<string, Grad> = new Map<string, Grad>();
	private mPathParser: PathParser = new PathParser();

	public constructor(inXML: Document, inConvertCubics: boolean = false) {
		super();
		const svg: Element = inXML.documentElement;
		if (svg == null || (svg.nodeName != "svg" && svg.nodeName != "svg:svg"))
			throw new Error("Not an SVG file (" + (svg == null ? "null" : svg.nodeName) + ")");

		this.mConvertCubics = inConvertCubics;

		this.width = this.getFloatStyle('width', svg, null, 0.0);
		this.height = this.getFloatStyle('height', svg, null, 0.0);

		if (this.width == 0)
			this.width = this.height;
		else if (this.height == 0)
			this.height = this.width;

		let viewBox: createjs.Rectangle | null = null;
		const vboxAttr: Attr | null = svg.attributes.getNamedItem('viewBox');
		if (vboxAttr != null) {
			const vbox: string = vboxAttr.value;
 			const params: string[] = vbox.indexOf(',') != -1 ? vbox.split(',') : vbox.split(' ');
 			viewBox = new createjs.Rectangle(
				this.trimToFloat(params[0]), this.trimToFloat(params[1]), this.trimToFloat(params[2]), this.trimToFloat(params[3])
			);
 			if (this.width == 0 && this.height == 0) {
 				this.width = viewBox.width;
 				this.height = viewBox.height;
 			}
 		} else {
 			if (this.width == 0 && this.height == 0) this.width = this.height = 400;
 			viewBox = new createjs.Rectangle(0, 0, this.width, this.height);
 		}
		// console.log(viewBox, this.width, this.height);
		this.loadGroup(this, svg, new createjs.Matrix2D(1, 0, 0, 1, -viewBox.x, -viewBox.y), null);
	}

	private trimToFloat(value: string): number { return parseFloat(value.trim()); }

	// @param angle : radian
	private rotatePoint(px: number, py: number, cx: number, cy: number, angle:number): [nx: number, ny: number] {
		// Convert angle from degrees to radians
		// const rad = angle * Math.PI / 180;
		const rad: number = angle;
	
		// Translate point to origin
		const xTranslated = px - cx;
		const yTranslated = py - cy;
	
		// Rotate point
		const xRotated = xTranslated * Math.cos(rad) - yTranslated * Math.sin(rad);
		const yRotated = xTranslated * Math.sin(rad) + yTranslated * Math.cos(rad);
	
		// Translate point back
		const nx = xRotated + cx;
		const ny = yRotated + cy;
	
		return [nx, ny];
	}

	private getTransAndRoatate(inTrans: string) : {tx: number, ty: number, r: number, isRotate: boolean, rx: number, ry: number} {
		const translateResult: string[] | null = SVGData.mTranslateMatch.exec(inTrans);
		let tx:number = 0, ty: number = 0;
		if (translateResult != null) {
			// TODO: Pre-translate
			tx = parseFloat(translateResult[1]);
			ty = parseFloat(translateResult[2]);
		}
		let r:number = 0, isRotate: boolean = false, rx: number, ry: number;
		const rotationResult: string[] | null = SVGData.mRotationMatch.exec(inTrans);
		if (rotationResult !== null) {
			var degrees = parseFloat(rotationResult[1]);
			rx = parseFloat(rotationResult[2]);
			if (isNaN(rx)) rx = 0;
			ry = parseFloat(rotationResult[3]);
			if (isNaN(ry)) ry = 0;
			r = degrees * Math.PI / 180;
			isRotate = true;
		}
		return {tx: tx, ty: ty, r: r, isRotate: isRotate, rx: rx, ry: ry}
	}

	// Applies the transformation specified in inTrans to ioMatrix. Returns the new scale
	// value after applying the transformation.
	private applyTransform(ioMatrix: createjs.Matrix2D, inTrans: string): number {
		var scale: number = 1.0;
		const translateResult: string[] | null = SVGData.mTranslateMatch.exec(inTrans);
		if (translateResult != null) {
			// TODO: Pre-translate
			ioMatrix.translate(parseFloat(translateResult[1]), parseFloat(translateResult[2]));
			return scale;
		}

		const scaleResult: string[] | null = SVGData.mScaleMatch.exec(inTrans);
		if (scaleResult != null) {
			// TODO: Pre-scale
			var s = parseFloat(scaleResult[1]);
			ioMatrix.scale(s, s);
			scale = s;
			return scale;
		}

		const matrixResult: string[] | null = SVGData.mMatrixMatch.exec(inTrans);
		if (matrixResult != null) {
			var m = new createjs.Matrix2D(
				parseFloat(matrixResult[1]),
				parseFloat(matrixResult[2]),
				parseFloat(matrixResult[3]),
				parseFloat(matrixResult[4]),
				parseFloat(matrixResult[5]),
				parseFloat(matrixResult[6])
			);
			m.appendMatrix(ioMatrix);
			ioMatrix.a = m.a;
			ioMatrix.b = m.b;
			ioMatrix.c = m.c;
			ioMatrix.d = m.d;
			ioMatrix.tx = m.tx;
			ioMatrix.ty = m.ty;
			scale = Math.sqrt(ioMatrix.a * ioMatrix.a + ioMatrix.c * ioMatrix.c);
			return scale;
		}

		const rotationResult: string[] | null = SVGData.mRotationMatch.exec(inTrans);
		if (rotationResult != null) {
			var degrees = parseFloat(rotationResult[1]);
			var rotationX = parseFloat(rotationResult[2]);
			if (isNaN(rotationX)) rotationX = 0;
			var rotationY = parseFloat(rotationResult[3]);
			if (isNaN(rotationY)) rotationY = 0;
			var radians = degrees * Math.PI / 180;
			ioMatrix.translate(-rotationX, -rotationY);
			ioMatrix.rotate(radians);
			ioMatrix.translate(rotationX, rotationY);
			return scale;
		}
		console.log("Warning, unknown transform:" + inTrans);
		return scale;
	}

	private getAndApplyTransform(xml: Element, matrix: createjs.Matrix2D): createjs.Matrix2D {
		const transform: Attr | null = xml.attributes.getNamedItem("transform");
		if (transform != null) {
			matrix = matrix.clone();
			this.applyTransform(matrix, transform.value);
		}
		return matrix;
	}

	private dumpGroup(g: Group, indent: string): void {
		console.log(indent + "Group:" + g.name);
		indent += "  ";
		for (const e of g.children) {
			switch (e.type) {
				case DisplayElementType.DisplayPath:
					console.log(indent + "Path" + "  " + e.path.matrix);
					break;
				case DisplayElementType.DisplayGroup:
					this.dumpGroup(e.group, indent + "   ");
					break;
				case DisplayElementType.DisplayText:
					console.log(indent + "Text " + e.text.text);
					break;
			}
		}
	}

	private getColorStyle(inKey: string, inNode: Element, inStyles: Map<string, string>, inDefault: number): number {
		var s = this.getStyle(inKey, inNode, inStyles, "");
		if (s == "") return inDefault;
		if (s.charAt(0) == '#') return SVGData.parseHex(s.substr(1));
		const matchResult: string[] | null = SVGData.mRGBMatch.exec(s);
		if (matchResult != null) return SVGData.parseRGBMatch(matchResult);
		return parseInt(s);
	}

	private getFillStyle(inKey: string, inNode: Element, inStyles: Map<string, string>): FillType {
		const s = this.getStyle(inKey, inNode, inStyles, "");
		if (s == "") return SVGData.defaultFill;
		if (s.charAt(0) == '#') return FillType.createFillSolid(SVGData.parseHex(s.substr(1)));

		const mRGBMatchResult: string[] | null = SVGData.mRGBMatch.exec(s);
		if (mRGBMatchResult != null) return FillType.createFillSolid(SVGData.parseRGBMatch(mRGBMatchResult));
		if (s == "none") return FillType.createFillNone();

		const mURLMatchResult: string[] | null = SVGData.mURLMatch.exec(s);
		if (mURLMatchResult != null) {
			const url: string = mURLMatchResult[1];
			if (this.mGrads.has(url)) return FillType.createFillGrad(this.mGrads.get(url));
			throw ("Unknown url:" + url);
		}
		throw ("Unknown fill string:" + s);
		return FillType.createFillNone();
	}

	private getFloatStyle(inKey: string, inNode: Element, inStyles: Map<string, string>, inDefault: number): number {
		const s = this.getStyle(inKey, inNode, inStyles, '');
		if (s == '' || s.endsWith('%')) return inDefault;
		return parseFloat(s);
	}

	private getStyleAndConvert<T>(inKey: string, inNode: Element, inStyles: Map<string, string>, inDefault: T, inConvert: Map<string, T>): T {
		const s = this.getStyle(inKey, inNode, inStyles, "");
		if (s == "" || !inConvert.has(s)) return inDefault;
		return inConvert.get(s);
	}

	private getStrokeStyle(inKey: string, inNode: Element, inStyles: Map<string, string>, inDefault: number): number {
		const s = this.getStyle(inKey, inNode, inStyles, '');
		if (s == '') return inDefault;
		const mRGBMatchResult: string[] | null = SVGData.mRGBMatch.exec(s);
		if (mRGBMatchResult != null) return SVGData.parseRGBMatch(mRGBMatchResult);
		if (s == 'none') return null;
		if (s.startsWith('#')) return SVGData.parseHex(s.substr(1));
		return parseInt(s);
	}

	private getStyle(inKey: string, inNode: Element, inStyles: Map<string, string>, inDefault: string) {
		const attr: Attr | null = inNode?.attributes.getNamedItem(inKey);
		if (attr != null) return attr.value;
		if (inStyles?.has(inKey)) return inStyles.get(inKey);
		return inDefault;
	}

	private getStyles(inNode: Element, inPrevStyles: Map<string, string>): Map<string, string> {
		const styleAttr: Attr | null = inNode.attributes.getNamedItem('style');
		if (styleAttr == null) return inPrevStyles;
		const styles: Map<string, string> = new Map<string, string>();
		if (inPrevStyles != null) inPrevStyles.forEach((value, key) => styles.set(key, value));

		const style: string = styleAttr.value;
		const strings: string[] = style.split(SVGData.mStyleSplit);
		for (const s of strings) {
			const mStyleValueResult: string[] | null = SVGData.mStyleValue.exec(s);
			if (mStyleValueResult != null) styles.set(mStyleValueResult[1], mStyleValueResult[2]);
		}
		return styles;
	}

	private loadDefs(inXML: Element): void {
		// Two passes - to allow forward xlinks
		for (let pass: number = 0; pass < 2; pass++) {
			for (let index: number = 0; index < inXML.children.length; index++) {
				const def: Element = inXML.children.item(index);
				let name: string = def.nodeName;
				if (name.substr(0, 4) == "svg:") name = name.substr(4);
				if (name == "linearGradient") {
					this.loadGradient(def, GradientType.LINEAR, pass == 1);
				} else if (name == "radialGradient") {
					this.loadGradient(def, GradientType.RADIAL, pass == 1);
				}
			}
		}
	}

	private loadGradient(inGrad: Element, inType: GradientType, inCrossLink: boolean): void {
		const name: string = inGrad.attributes.getNamedItem('id').value;
		const grad: Grad = new Grad(inType);
		const xlinkAttr: Attr | null = inGrad.attributes.getNamedItem('xlink:href');
		if (inCrossLink && xlinkAttr != null) {
			const xlink: string = xlinkAttr.value;
			if (xlink.charAt(0) != "#") throw ("xlink - unknown syntax : " + xlink);

			const base: Grad = this.mGrads.get(xlink.substr(1));
			if (base != null) {
				grad.colors = base.colors;
				grad.alphas = base.alphas;
				grad.ratios = base.ratios;
				grad.gradMatrix = base.gradMatrix.clone();
				grad.spread = base.spread;
				grad.interp = base.interp;
				grad.radius = base.radius;
			} else {
				throw ("Unknown xlink : " + xlink);
			}
		}
		const x1: Attr | null = inGrad.attributes.getNamedItem('x1');
		if (x1 != null) {
			grad.x1 = parseFloat(x1.value);
			grad.y1 = SVGData.getAttrFloat(inGrad, 'y1');
			grad.x2 = SVGData.getAttrFloat(inGrad, "x2");
			grad.y2 = SVGData.getAttrFloat(inGrad, "y2");
		} else {
			grad.x1 = SVGData.getAttrFloat(inGrad, "cx");
			grad.y1 = SVGData.getAttrFloat(inGrad, "cy");
			grad.x2 = SVGData.getAttrFloat(inGrad, "fx", grad.x1);
			grad.y2 = SVGData.getAttrFloat(inGrad, "fy", grad.y1);
		}
		grad.radius = SVGData.getAttrFloat(inGrad, "r");

		const gradientTransform: Attr | null = inGrad.attributes.getNamedItem('gradientTransform');
		if (gradientTransform != null) this.applyTransform(grad.gradMatrix, gradientTransform.value);
		// todo - grad.spread = base.spread;
		for (let index: number = 0; index < inGrad.children.length; index++) {
			const stop: Element = inGrad.children.item(index);
			const styles: Map<string, string> = this.getStyles(stop, null);
			grad.colors.push(this.getColorStyle("stop-color", stop, styles, 0x000000));
			grad.alphas.push(this.getFloatStyle("stop-opacity", stop, styles, 1.0));
			grad.ratios.push(Math.floor(SVGData.getAttrFloat(stop, 'offset', 0) * 255.0));
		}
		this.mGrads.set(name, grad);
	}

	public loadGroup(g: Group, inG: Element, matrix: createjs.Matrix2D, inStyles: Map<string, string>): Group {
		matrix = this.getAndApplyTransform(inG, matrix);

		const inkscape: Attr | null = inG.attributes.getNamedItem("inkscape:label");
		if (inkscape != null) {
			g.name = inkscape.value;
		} else {
			const id: Attr | null = inG.attributes.getNamedItem("id");
			if (id != null) g.name = id.value;
		}

		const styles: Map<string, string> = this.getStyles(inG, inStyles);

		/*
		supports eg:
		<g>
			<g opacity="0.5">
				<path ... />
				<polygon ... />
			</g>
		</g>
		*/
		const opacityAttr: Attr | null = inG.attributes.getNamedItem("opacity");
		if (opacityAttr != null) {
			var opacity: string = opacityAttr.value;
			if (styles.has("opacity")) opacity = (parseFloat(opacity) * parseFloat(styles.get("opacity"))).toString();
			styles.set("opacity", opacity);
		}

		for (let index: number = 0; index < inG.children.length; index++) {
			const el: Element = inG.children.item(index);
			var name = el.nodeName;
			if (name.substr(0, 4) == "svg:") name = name.substr(4);
			const display: Attr | null = el.attributes.getNamedItem("display");
			if (display != null && display.value == "none") continue;
			if (name == "defs") {
				this.loadDefs(el);
			} else if (name == "g") {
				g.children.push(DisplayElement.createDisplayGroup(this.loadGroup(new Group(), el, matrix, styles)));
			} else if (name == "path" || name == "line" || name == "polyline") {
				g.children.push(DisplayElement.createDisplayPath(this.loadPath(el, matrix, styles, false, false)));
			} else if (name == "rect") {
				g.children.push(DisplayElement.createDisplayPath(this.loadPath(el, matrix, styles, true, false)));
			} else if (name == "polygon") {
				g.children.push(DisplayElement.createDisplayPath(this.loadPath(el, matrix, styles, false, false)));
			} else if (name == "ellipse") {
				g.children.push(DisplayElement.createDisplayPath(this.loadPath(el, matrix, styles, false, true)));
			} else if (name == "circle") {
				g.children.push(DisplayElement.createDisplayPath(this.loadPath(el, matrix, styles, false, true, true)));
			} else if (name == "text") {
				g.children.push(DisplayElement.createDisplayText(this.loadText(el, matrix, styles)));
			} else if (name == "linearGradient") {
				this.loadGradient(el, GradientType.LINEAR, true);
			} else if (name == "radialGradient") {
				this.loadGradient(el, GradientType.RADIAL, true);
			} else {
				// throw("Unknown child : " + el.nodeName );
			}
		}
		return g;
	}

	public loadPath(
		inPath: Element, matrix: createjs.Matrix2D, inStyles: Map<string, string>,
		inIsRect: boolean, inIsEllipse: boolean, inIsCircle: boolean = false
	): Path {
		matrix = this.getAndApplyTransform(inPath, matrix);
		const styles: Map<string, string> = this.getStyles(inPath, inStyles);
		const name: string = SVGData.getAttrString(inPath, 'id');
		const path: Path = new Path();

		path.fill = this.getFillStyle("fill", inPath, styles);
		path.alpha = this.getFloatStyle("opacity", inPath, styles, 1.0);
		path.fill_alpha = this.getFloatStyle("fill-opacity", inPath, styles, 1.0);
		path.stroke_alpha = this.getFloatStyle("stroke-opacity", inPath, styles, 1.0);
		path.stroke_colour = this.getStrokeStyle("stroke", inPath, styles, null);
		path.stroke_width = this.getFloatStyle("stroke-width", inPath, styles, 1.0);
		path.stroke_caps = this.getStyleAndConvert("stroke-linecap", inPath, styles, CapsStyle.NONE, new Map<string, CapsStyle>([
			["round", CapsStyle.ROUND], ["square", CapsStyle.SQUARE], ["butt", CapsStyle.NONE]
		]));
		path.joint_style = this.getStyleAndConvert("stroke-linejoin", inPath, styles, JointStyle.MITER, new Map<string, JointStyle>([
			["bevel", JointStyle.BEVEL], ["round", JointStyle.ROUND], ["miter", JointStyle.MITER]
		]));
		path.miter_limit = this.getFloatStyle("stroke-miterlimit", inPath, styles, 3.0);
		path.segments = [];
		path.matrix = matrix;
		path.name = name;
		if (inIsRect) {
			const x: number = SVGData.getAttrFloat(inPath, 'x', 0);
			const y: number = SVGData.getAttrFloat(inPath, 'y', 0)
			const w: number = SVGData.getAttrFloat(inPath, 'width', 0);
			const h: number = SVGData.getAttrFloat(inPath, 'height', 0);
			let rx: number = SVGData.getAttrFloat(inPath, 'rx', null);
			let ry: number = SVGData.getAttrFloat(inPath, 'ry', null);
			const transform: Attr | null = inPath.attributes.getNamedItem("transform");
			if (transform !== null) {
				const trans = this.getTransAndRoatate(transform.value);
				if (trans.isRotate) {
					let _tlx: number = x, _tly: number = y;
					let _trx: number = x + w, _try: number = y;
					let _brx: number = x + w, _bry: number = y + h;
					let _blx: number = x, _bly: number = y + h;
					let [_ntlx, _ntly] = this.rotatePoint(_tlx, _tly, trans.rx, trans.ry, trans.r);
					let [_ntrx, _ntry] = this.rotatePoint(_trx, _try, trans.rx, trans.ry, trans.r);
					let [_nbrx, _nbry] = this.rotatePoint(_brx, _bry, trans.rx, trans.ry, trans.r);
					let [_nblx, _nbly] = this.rotatePoint(_blx, _bly, trans.rx, trans.ry, trans.r);
					path.segments.push(new MoveSegment(_ntlx, _ntly));
					path.segments.push(new QuadraticSegment(_ntlx, _ntly, _ntrx, _ntry));
					path.segments.push(new QuadraticSegment(_ntrx, _ntry, _nbrx, _nbry));
					path.segments.push(new QuadraticSegment(_nbrx, _nbry, _nblx, _nbly));
					path.segments.push(new QuadraticSegment(_nblx, _nbly, _ntlx, _ntly));

					// path.segments.push(new MoveSegment(100, 100));
					// path.segments.push(new QuadraticSegment(100, 100, 200, 100));
					// path.segments.push(new QuadraticSegment(200, 100, 200, 200));
					// path.segments.push(new QuadraticSegment(200, 100, 100, 200));
					// path.segments.push(new QuadraticSegment(100, 200, 100, 100));

				} else {
					path.segments.push(new RectSegment(x, y, w, h, rx, ry));
				}
			} else {
				path.segments.push(new RectSegment(x, y, w, h, rx, ry));
			}
		} else if (inIsEllipse) {
			const x: number = SVGData.getAttrFloat(inPath, 'cx', 0);
			const y: number = SVGData.getAttrFloat(inPath, 'cy', 0);
			const r: number = inIsCircle ? SVGData.getAttrFloat(inPath, 'r', 0) : 0;
			const w: number = inIsCircle ? r : SVGData.getAttrFloat(inPath, 'rx', 0);
			const w_: number = w * SVGData.SIN45;
			const cw_: number = w * SVGData.TAN22;
			const h: number = inIsCircle ? r : SVGData.getAttrFloat(inPath, 'ry', 0);
			const h_: number = h * SVGData.SIN45;
			const ch_: number = h * SVGData.TAN22;
			path.segments.push(new MoveSegment(x + w, y));
			path.segments.push(new QuadraticSegment(x + w, y + ch_, x + w_, y + h_));
			path.segments.push(new QuadraticSegment(x + cw_, y + h, x, y + h));
			path.segments.push(new QuadraticSegment(x - cw_, y + h, x - w_, y + h_));
			path.segments.push(new QuadraticSegment(x - w, y + ch_, x - w, y));
			path.segments.push(new QuadraticSegment(x - w, y - ch_, x - w_, y - h_));
			path.segments.push(new QuadraticSegment(x - cw_, y - h, x, y - h));
			path.segments.push(new QuadraticSegment(x + cw_, y - h, x + w_, y - h_));
			path.segments.push(new QuadraticSegment(x + w, y - ch_, x + w, y));
		} else {
			const points: Attr | null = inPath.attributes.getNamedItem('points');
			const x1: Attr | null = inPath.attributes.getNamedItem('x1');
			const y1: Attr | null = inPath.attributes.getNamedItem('y1');
			const x2: Attr | null = inPath.attributes.getNamedItem('x2');
			const y2: Attr | null = inPath.attributes.getNamedItem('y2');
			const pathData: Attr | null = inPath.attributes.getNamedItem('d');
			
			const d: string = points != null ? ("M" + points.value + "z") : x1 != null ?
				("M" + x1.value + "," + y1.value + " " + x2.value + "," + y2.value + "z") : pathData.value;
			for (const segment of this.mPathParser.parse(d, this.mConvertCubics, pathData ? true : false)) path.segments.push(segment);
		}
		return path;
	}

	public loadText(inText: Element, matrix: createjs.Matrix2D, inStyles: Map<string, string>): SVGText {
		matrix = this.getAndApplyTransform(inText, matrix);

		const styles: Map<string, string> = this.getStyles(inText, inStyles);
		const text: SVGText = new SVGText();

		text.matrix = matrix;
		text.name = SVGData.getAttrString(inText, 'id');
		text.x = SVGData.getAttrFloat(inText, "x");
		text.y = SVGData.getAttrFloat(inText, "y");
		text.fill = this.getFillStyle("fill", inText, styles);
		text.fill_alpha = this.getFloatStyle("fill-opacity", inText, styles, 1.0);
		text.stroke_alpha = this.getFloatStyle("stroke-opacity", inText, styles, 1.0);
		text.stroke_colour = this.getStrokeStyle("stroke", inText, styles, null);
		text.stroke_width = this.getFloatStyle("stroke-width", inText, styles, 1.0);
		text.font_family = this.getStyle("font-family", inText, styles, "");
		text.font_size = this.getFloatStyle("font-size", inText, styles, 12);
		text.letter_spacing = this.getFloatStyle("letter-spacing", inText, styles, 0);
		text.kerning = this.getFloatStyle("kerning", inText, styles, 0);
		text.text_align = this.getStyle("text-align", inText, styles, "start");

		let string: string = "";

		for (let index: number = 0; index < inText.children.length; index++)
			string += inText.children.item(index).toString();
		//trace(string);
		text.text = string;
		return text;
	}

	private static parseHex(hex: String): number {
		// Support 3-character hex color shorthand
		//  e.g. #RGB -> #RRGGBB
		if (hex.length == 3) {
			hex = hex.substr(0, 1) + hex.substr(0, 1) +
				hex.substr(1, 1) + hex.substr(1, 1) +
				hex.substr(2, 1) + hex.substr(2, 1);
		}
		return parseInt("0x" + hex);
	}

	private static parseRGBMatch(rgbMatchResult: string[]): number {
		// CSS2 rgb color definition, matches 0-255 or 0-100%
		// e.g. rgb(255,127,0) == rgb(100%,50%,0)
		function range(val: number): number {
			// constrain to Int 0-255
			if (val < 0) { val = 0; }
			if (val > 255) { val = 255; }
			return Math.floor(val);
		}
		var r = parseFloat(rgbMatchResult[1]);
		if (rgbMatchResult[1] == '%') { r = r * 255 / 100; }
		var g = parseFloat(rgbMatchResult[3]);
		if (rgbMatchResult[3] == '%') { g = g * 255 / 100; }
		var b = parseFloat(rgbMatchResult[5]);
		if (rgbMatchResult[5] == '%') { b = b * 255 / 100; }
		return (range(r) << 16) | (range(g) << 8) | range(b);
	}

	private static getAttrFloat<T>(xml: Element, name: string, or: T | number = 0): T | number {
		const attr: Attr | null = xml.attributes.getNamedItem(name);
		return attr != null ? parseFloat(attr.value) : or;
	}

	private static getAttrString<T>(xml: Element, name: string, or: string = ''): string {
		const attr: Attr | null = xml.attributes.getNamedItem(name);
		return attr != null ? attr.value : or;
	}

}