const MaxRectsBinPack = require("../build/MaxRectsBinPack.js");

const maxWidth = 512;
const maxHeight = 256;

const pack = new MaxRectsBinPack.Packer(maxWidth, maxHeight, {
     allowRotate: true,
     pot: true,
     // square: true,
     // padding: 0,
});

const rectangles = [{
    width: 20,
    height: 100,
    id: '1'
}, {
    width: 200,
    height: 70,
    id: '2'
}, {
    width: 30,
    height: 70,
    id: '3'
}];
const result = pack.insertRects(rectangles, MaxRectsBinPack.ShortSideFit);
console.log(result);
console.log(result.rects);
