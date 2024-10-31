import CapsStyle from '../gfx/CapsStyle';
import { FillType } from './FillType';
import JointStyle from '../gfx/JointStyle';
import { PathSegment } from './PathSegment';

export default class {

   public matrix: createjs.Matrix2D;
   public name: string;
   public font_size: number;
   public fill: FillType;
   public alpha: number;
   public fill_alpha: number;
   public stroke_alpha: number;
   public stroke_colour: number;
   public stroke_width: number;
   public stroke_caps: CapsStyle;
   public joint_style: JointStyle;
   public miter_limit: number;
   public segments: PathSegment[];

   public constructor() {}

}