import SVGPathCommander, {
  type PathArray,
  type AbsoluteArray
} from 'svg-path-commander';
import { ArcSegment, CubicSegment, DrawSegment, MoveSegment, PathSegment, QuadraticSegment } from './PathSegment';

const {
	parsePathString,
	pathToAbsolute,
	normalizePath,
	getDrawDirection,
} = SVGPathCommander

export default class PathParser {

	private static MOVE: number = "M".charCodeAt(0);
	private static MOVER: number = "m".charCodeAt(0);
	private static LINE: number = "L".charCodeAt(0);
	private static LINER: number = "l".charCodeAt(0);
	private static HLINE: number = "H".charCodeAt(0);
	private static HLINER: number = "h".charCodeAt(0);
	private static VLINE: number = "V".charCodeAt(0);
	private static VLINER: number = "v".charCodeAt(0);
	private static CUBIC: number = "C".charCodeAt(0);
	private static CUBICR: number = "c".charCodeAt(0);
	private static SCUBIC: number = "S".charCodeAt(0);
	private static SCUBICR: number = "s".charCodeAt(0);
	private static QUAD: number = "Q".charCodeAt(0);
	private static QUADR: number = "q".charCodeAt(0);
	private static SQUAD: number = "T".charCodeAt(0);
	private static SQUADR: number = "t".charCodeAt(0);
	private static ARC: number = "A".charCodeAt(0);
	private static ARCR: number = "a".charCodeAt(0);
	private static CLOSE: number = "Z".charCodeAt(0);
	private static CLOSER: number = "z".charCodeAt(0);

	private lastMoveX: number;
	private lastMoveY: number;
	private prev: PathSegment;

	public constructor() {

	}
	
	private isReverse(svgPath: string): boolean {
		const parsedPath: PathArray = parsePathString(svgPath);
		const absolutePath: AbsoluteArray = pathToAbsolute(parsedPath);
		const normalizedPath: AbsoluteArray = normalizePath(absolutePath);
		const subpaths: AbsoluteArray[] = this.splitIntoSubpaths(normalizedPath);

		let isReverse = true;
		subpaths.forEach(subpath => {
			const direction = getDrawDirection(subpath);
			if (!direction) {
				isReverse = false;
			}
		});

		return isReverse;
	}

	private splitIntoSubpaths(normalizedPath: AbsoluteArray): AbsoluteArray[] {
		const subpaths: AbsoluteArray[] = [];
		// @ts-ignore
		let currentPath: AbsoluteArray = [];

		normalizedPath.forEach(cmd => {
			if (typeof cmd[0] === 'string' && cmd[0].toLowerCase() === 'm' && currentPath.length) {
				subpaths.push(currentPath);
				// @ts-ignore
				currentPath = [];
			}
			currentPath.push(cmd);
		});

		if (currentPath.length) {
			subpaths.push(currentPath);
		}

		return subpaths;
	}

	public parse(pathToParse: string, inConvertCubics: boolean, isPath: boolean): PathSegment[] {
		var segments: PathSegment[] = [];
		this.lastMoveX = this.lastMoveY = 0;
		this.prev = null;
		const isReverse = isPath ? this.isReverse(pathToParse) : false;

		const pathCommander = new SVGPathCommander(pathToParse);
		if (isReverse) {
			pathCommander.reverse(true)
		}
		
		pathCommander.segments.forEach(command => {
			const [type, ...args] = command;
			this.prev = this.createCommand(type.charCodeAt(0), args);
			if (inConvertCubics && this.prev.getType() == PathSegment.CUBIC) {
				var px = this.prev.prevX();
				var py = this.prev.prevY();
				var cubic: CubicSegment = this.prev as CubicSegment;
				var quads = cubic.toQuadratics(px, py);
				for (const q of quads) {
					segments.push(q);
				}
			} else {
				segments.push(this.prev);
			}
		});
		return segments;
	}

	private prevX(): number { return this.prev != null ? this.prev.prevX() : 0; }
	private prevY(): number { return this.prev != null ? this.prev.prevY() : 0; }
	private prevCX(): number { return this.prev != null ? this.prev.prevCX() : 0; }
	private prevCY(): number { return this.prev != null ? this.prev.prevCY() : 0; }

	private createCommand(code: number, a: number[]): PathSegment {
		switch (code) {
			case PathParser.MOVE:
				this.lastMoveX = a[0];
				this.lastMoveY = a[1];
				return new MoveSegment(this.lastMoveX, this.lastMoveY);
			case PathParser.MOVER:
				this.lastMoveX = a[0] + this.prevX();
				this.lastMoveY = a[1] + this.prevY();
				return new MoveSegment(this.lastMoveX, this.lastMoveY);
			case PathParser.LINE: return new DrawSegment(a[0], a[1]);
			case PathParser.LINER: return new DrawSegment(a[0] + this.prevX(), a[1] + this.prevY());
			case PathParser.HLINE: return new DrawSegment(a[0], this.prevY());
			case PathParser.HLINER: return new DrawSegment(a[0] + this.prevX(), this.prevY());
			case PathParser.VLINE: return new DrawSegment(this.prevX(), a[0]);
			case PathParser.VLINER: return new DrawSegment(this.prevX(), a[0] + this.prevY());
			case PathParser.CUBIC: return new CubicSegment(a[0], a[1], a[2], a[3], a[4], a[5]);
			case PathParser.CUBICR:
				var rx = this.prevX();
				var ry = this.prevY();
				return new CubicSegment(a[0] + rx, a[1] + ry, a[2] + rx, a[3] + ry, a[4] + rx, a[5] + ry);
			case PathParser.SCUBIC:
				var rx = this.prevX();
				var ry = this.prevY();
				return new CubicSegment(rx * 2 - this.prevCX(), ry * 2 - this.prevCY(), a[0], a[1], a[2], a[3]);
			case PathParser.SCUBICR:
				var rx = this.prevX();
				var ry = this.prevY();
				return new CubicSegment(rx * 2 - this.prevCX(), ry * 2 - this.prevCY(), a[0] + rx, a[1] + ry, a[2] + rx, a[3] + ry);
			case PathParser.QUAD: return new QuadraticSegment(a[0], a[1], a[2], a[3]);
			case PathParser.QUADR:
				var rx = this.prevX();
				var ry = this.prevY();
				return new QuadraticSegment(a[0] + rx, a[1] + ry, a[2] + rx, a[3] + ry);
			case PathParser.SQUAD:
				var rx = this.prevX();
				var ry = this.prevY();
				return new QuadraticSegment(rx * 2 - this.prevCX(), rx * 2 - this.prevCY(), a[2], a[3]);
			case PathParser.SQUADR:
				var rx = this.prevX();
				var ry = this.prevY();
				return new QuadraticSegment(rx * 2 - this.prevCX(), ry * 2 - this.prevCY(), a[0] + rx, a[1] + ry);
			case PathParser.ARC:
				return new ArcSegment(this.prevX(), this.prevY(), a[0], a[1], a[2], a[3] != 0., a[4] != 0., a[5], a[6]);
			case PathParser.ARCR:
				var rx = this.prevX();
				var ry = this.prevY();
				return new ArcSegment(rx, ry, a[0], a[1], a[2], a[3] != 0., a[4] != 0., a[5] + rx, a[6] + ry);
			case PathParser.CLOSE:
				return new DrawSegment(this.lastMoveX, this.lastMoveY);
			case PathParser.CLOSER:
				return new DrawSegment(this.lastMoveX, this.lastMoveY);
		}

		return null;
	}
}