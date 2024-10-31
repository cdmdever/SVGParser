
export class Root {
	static ctx:any;
	static scale: number = 1;
	static shapeScale: number = 1;
	static svgX: number = 50;
	static svgY: number = 50;
};

function getPixel(imageData:any, x:number, y:number) {
	if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
	  return [-1, -1, -1, -1];  // impossible color
	} else {
	  const offset:number = (y * imageData.width + x) * 4;
	  return imageData.data.slice(offset, offset + 4);
	}
  }

  function setPixel(imageData:any, x:number, y:number, color:number[]) {
	const offset = (y * imageData.width + x) * 4;
	imageData.data[offset + 0] = color[0];
	imageData.data[offset + 1] = color[1];
	imageData.data[offset + 2] = color[2];
	imageData.data[offset + 3] = color[0];
  }

  function colorsMatch(a:any, b:any, rangeSq:number) {
	const dr = Math.abs(a[0] - b[0]);
	const dg = Math.abs(a[1] - b[1]);
	const db = Math.abs(a[2] - b[2]);
	const da = Math.abs(a[3] - b[3]);
	return dr * dr + dg * dg + db * db + da * da < rangeSq;
  }

  function floodFill(ctx:any, x:number, y:number, fillColor:number[], range:number = 1) {
	// read the pixels in the canvas
	// ctx.moveTo(x,y);
	// ctx.lineTo(x+10,y);
	const imageData:any = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

	// x *= Root.shapeScale;
	// y *= Root.shapeScale;
	// x += Root.svgX;
	// y += Root.svgY + 5;
	// x = Math.ceil(x *  Root.scale);
	// y = Math.ceil(y * Root.scale);

	// setPixel(imageData, x, y, fillColor);
	// ctx.putImageData(imageData, 0, 0);
	// return;

	// flags for if we visited a pixel already
	const visited:Uint8Array = new Uint8Array(imageData.width, imageData.height);

	// get the color we're filling
	const targetColor:Uint8ClampedArray = getPixel(imageData, x, y);

	const rangeSq:number = range * range;
	// check we are actually filling a different color
	if (colorsMatch(targetColor, fillColor, rangeSq)) return;
	const pixelsToCheck:number[] = [x, y];
	while (pixelsToCheck.length > 0) {
		const y:number = pixelsToCheck.pop();
		const x:number = pixelsToCheck.pop();
		if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) continue;
		const pos:number = y * imageData.width + x;
		if (visited[pos]) continue;
		const currentColor:Uint8ClampedArray = getPixel(imageData, x, y);
		if (!colorsMatch(currentColor, targetColor, rangeSq)) continue;
		setPixel(imageData, x, y, fillColor);
		visited[y * imageData.width + x] = 1; // mark we were here already
		pixelsToCheck.push(x + 1, y);
		pixelsToCheck.push(x - 1, y);
		pixelsToCheck.push(x, y + 1);
		pixelsToCheck.push(x, y - 1);
	}
	  // put the data back
	  ctx.putImageData(imageData, 0, 0);
  }

export default class FloodFill {

	public x:number;
	public y:number;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public exec(ctx:CanvasRenderingContext2D) {
		floodFill(ctx, this.x, this.y, [0x80, 0x80, 0x80, 255], 1);
	}

}