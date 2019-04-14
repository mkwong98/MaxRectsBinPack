const MaxRectsBinPack = require("../build/MaxRectsBinPack.js");

const pack = new MaxRectsBinPack.Packer(512, 256, {
     allowRotate: true,
     // pot: true,
     // square: true,
     // padding: true,
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
