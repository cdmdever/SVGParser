import Grad from './Grad';

export class FillType {

	public readonly type: FillTypeType;

	private readonly value: Grad | number | void;

	private constructor(type: FillTypeType, value: Grad | number | void) {
		this.type = type;
		this.value = value;
	}

	public get grad(): Grad { return this.value as Grad; }
	public get color(): number { return this.value as number; }

	public static createFillGrad(value: Grad): FillType { return new FillType(FillTypeType.FillGrad, value); }
	public static createFillSolid(value: number): FillType { return new FillType(FillTypeType.FillSolid, value); }
	public static createFillNone(): FillType { return new FillType(FillTypeType.FillNone, null); }

}

export enum FillTypeType {
   FillGrad,
   FillSolid,
   FillNone
}