import Path from './Path';
import SVGText from './SVGText';

export class Group {

	public name: string = '';
	public children: DisplayElement[] = [];

	public constructor() {}

	public hasGroup(inName: string) { return this.findGroup(inName) != null; }

	public findGroup(inName: string): Group {
		for (const child of this.children) switch (child.type) {
			case DisplayElementType.DisplayGroup:
				const group: Group = child.group;
				if (group.name == inName) return group;
				const inGroup:Group = group.findGroup(inName);
				if(inGroup != null) return inGroup;
				break;
			case DisplayElementType.DisplayPath:
			case DisplayElementType.DisplayText:
		}
		return null;
	}

}

export class DisplayElement {

	public readonly type: DisplayElementType;

	private readonly value: Path | Group | SVGText;

	private constructor(type: DisplayElementType, value: Path | Group | SVGText) {
		this.type = type;
		this.value = value;
	}

	public get path(): Path { return this.value as Path; }
	public get group(): Group { return this.value as Group; }
	public get text(): SVGText { return this.value as SVGText; }

	public static createDisplayPath(value: Path): DisplayElement { return new DisplayElement(DisplayElementType.DisplayPath, value); }
	public static createDisplayGroup(value: Group): DisplayElement { return new DisplayElement(DisplayElementType.DisplayGroup, value); }
	public static createDisplayText(value: SVGText): DisplayElement { return new DisplayElement(DisplayElementType.DisplayText, value); }

}

export enum DisplayElementType {
   DisplayPath,
   DisplayGroup,
   DisplayText
}