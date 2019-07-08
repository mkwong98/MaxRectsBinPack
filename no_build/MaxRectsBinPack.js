/**
 * Based on the Public Domain MaxRectanglesBinPack.cpp source by Jukka Jylänki
 * https://github.com/juj/RectangleBinPack/
 *
 * Based on C# port by Sven Magnus
 * http://unifycommunity.com/wiki/index.php?title=MaxRectanglesBinPack
 *
 * Based on ActionScript3 by DUZENGQIANG
 * http://www.duzengqiang.com/blog/post/971.html
 *
 * Ported to javascript by 06wj
 * https://github.com/06wj/MaxRectsBinPack
 *
 * Refactor & improve by finscn
 * https://github.com/finscn/MaxRectsBinPack
 */


const ShortSideFit = 'ShortSideFit'; // Positions the Rectangle against the short side of a free Rectangle into which it fits the best.
const LongSideFit = 'LongSideFit'; // Positions the Rectangle against the long side of a free Rectangle into which it fits the best.
const AreaFit = 'AreaFit'; // Positions the Rectangle into the smallest free Rectangle into which it fits.
const BottomLeft = 'BottomLeft'; // Does the Tetris placement.
const ContactPoint = 'ContactPoint'; // Choosest the placement where the Rectangle touches other Rectangles as much as possible.

/**
 * MaxRectanglesBinPack
 */
class MaxRectsBinPack {
    /**
     * @constructor
     * @param {Number} maxWidth - The max width of container
     * @param {Number} maxHeight - The max height of container
     * @param {Object} options - options of packing:
     *        allowRotate:  allow rotate the rects
     *        pot:  use power of 2 sizing
     *        square:  use square size
     *        padding:  the border padidng of each eectangle
     */
    constructor(maxWidth, maxHeight, options) {
        Object.assign(this, {
            allowRotate: false,
            pot: false,
            // TODO
            square: false,
            padding: 0,
        });

        this.usedRectangles = [];
        this.freeRectangles = [];

        this.init(maxWidth, maxHeight, options);
    }

    /**
     * @constructor
     * @param {Number} maxWidth - The max width of container
     * @param {Number} maxHeight - The max height of container
     * @param {Object} options - options of packing:
     *        allowRotate:  allow rotate the rects
     *        pot:  use power of 2 sizing
     *        square:  use square size
     *        padding:  the border padidng of each eectangle
     */
    init(maxWidth, maxHeight, options) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;

        Object.assign(this, options);

        this.reset();
    }

    reset() {
        this.usedRectangles.length = 0;
        this.freeRectangles.length = 0;
        this.freeRectangles.push(new Rect(0, 0, this.maxWidth, this.maxHeight));
    }

    /**
     * insert a new rect
     * @param  {Number} width - The width of the rect
     * @param  {Number} height - The height of the rect
     * @param  {String} rule - The pack rule, allow value is ShortSideFit, LongSideFit, AreaFit, BottomLeft, ContactPoint
     * @return {Rect}
     */
    insert(width, height, rule) {
        let newNode = new Rect();
        const score1 = {
            value: 0
        };

        const score2 = {
            value: 0
        };

        rule = rule || ShortSideFit;

        const padding = this.padding;
        const padding2 = padding * 2;

        if (padding) {
            width += padding2;
            height += padding2;
        }

        switch (rule) {
            case ShortSideFit:
                newNode = this._findPositionForNewNodeShortSideFit(width, height, score1, score2);
                break;
            case LongSideFit:
                newNode = this._findPositionForNewNodeLongSideFit(width, height, score1, score2);
                break;
            case AreaFit:
                newNode = this._findPositionForNewNodeAreaFit(width, height, score1, score2);
                break;
            case BottomLeft:
                newNode = this._findPositionForNewNodeBottomLeft(width, height, score1, score2);
                break;
            case ContactPoint:
                newNode = this._findPositionForNewNodeContactPoint(width, height, score1);
                break;
            default:
                break;
        }

        if (newNode.height === 0) {
            return newNode;
        }

        this._placeRectangle(newNode);
        return newNode;
    }

    _cloneRectangles(rectangles) {
        const newRects = [];

        rectangles.forEach((r, index) => {
            newRects.push({
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                _index: index,
            });
        });

        return newRects;
    }

    /**
     * Insert a set of rectangles
     * @param  {Rect[]} rectangles - The set of rects, allow custum property.
     * @param  {String} rule - The pack rule, allow value is ShortSideFit, LongSideFit, AreaFit, BottomLeft, ContactPoint
     *         If don't pass rule, will try all rules, then chose the best one.
     * @return {Rect[]} The result of bin pack.
     */
    insertRects(rectangles, rule) {
        if (!rule) {
            rule = this.getBestRule(rectangles);
        }

        let realWidth = -1;
        let realHeight = -1;

        const result = {
            rects: [],
            rule,
            width: realWidth,
            height: realHeight,
            realWidth,
            realHeight,
        };

        const inputCount = rectangles.length;

        const padding = this.padding;
        const padding2 = padding * 2;

        if (padding) {
            for (let i = 0; i < inputCount; i++) {
                const rect = rectangles[i];
                rect.width += padding2;
                rect.height += padding2;
            }
        }

        while (rectangles.length > 0) {
            let bestScore1 = Infinity;
            let bestScore2 = Infinity;
            let bestRectangleIndex = -1;
            let bestNode = new Rect();

            for (let i = 0; i < rectangles.length; i++) {
                const score1 = {
                    value: 0
                };
                const score2 = {
                    value: 0
                };
                const newNode = this._scoreRectangle(rectangles[i].width, rectangles[i].height, rule, score1, score2);

                if (score1.value < bestScore1 || (score1.value === bestScore1 && score2.value < bestScore2)) {
                    bestScore1 = score1.value;
                    bestScore2 = score2.value;
                    bestNode = newNode;
                    bestRectangleIndex = i;
                }
            }

            if (bestRectangleIndex === -1) {
                break;
            }

            this._placeRectangle(bestNode);

            const rect = rectangles.splice(bestRectangleIndex, 1)[0];

            const fitInfo = {
                x: bestNode.x,
                y: bestNode.y,
                width: bestNode.width,
                height: bestNode.height,
            };

            if (rect.width !== bestNode.width || rect.height !== bestNode.height) {
                fitInfo.rotated = true;
            }

            realWidth = Math.max(realWidth, fitInfo.x + fitInfo.width);
            realHeight = Math.max(realHeight, fitInfo.y + fitInfo.height);

            rect.fitInfo = fitInfo;

            result.rects.push(rect);
        }

        const fitCount = result.rects.length;

        result.fitCount = fitCount;
        result.unfitCount = inputCount - fitCount;
        result.done = result.unfitCount === 0;

        if (padding) {
            for (let i = 0; i < fitCount; i++) {
                const rect = result.rects[i];
                rect.width -= padding2;
                rect.height -= padding2;

                const fitInfo = rect.fitInfo;
                fitInfo.x += padding;
                fitInfo.y += padding;
                fitInfo.width -= padding2;
                fitInfo.height -= padding2;
            }
        }

        result.realWidth = realWidth;
        result.realHeight = realHeight;
        result.realArea = realWidth * realHeight;

        const wp = Math.ceil(Math.log(realWidth) / Math.log(2));
        const hp = Math.ceil(Math.log(realHeight) / Math.log(2));
        result.binWidth = 2 ** wp;
        result.binHeight = 2 ** hp;
        result.binArea = result.binWidth * result.binHeight;

        if (this.pot) {
            result.width = result.binWidth;
            result.height = result.binHeight;
        } else {
            result.width = realWidth;
            result.height = realHeight;
        }

        // if (this.square) {
        //     result.width = Math.max(result.width, result.height);
        //     result.height = Math.max(result.width, result.height);
        // }

        result.area = result.width * result.height;

        return result;
    }

    getBestRule(rectangles) {
        const ruleList = [
            ShortSideFit,
            LongSideFit,
            AreaFit,
            BottomLeft,
            ContactPoint,
        ];
        const resultList = [];

        ruleList.forEach((rule, index) => {
            const rectList = this._cloneRectangles(rectangles);
            this.reset();
            const result = this.insertRects(rectList, rule);
            result._ruleIndex = index;

            if (result.done) {
                resultList.push(result);

                // console.log(result.rule, result.realWidth, result.realHeight);
            }
        });
        this.reset();

        // resultList.sort((a, b) => {
        //     let d = 0;
        //     d = d || a.binArea - b.binArea;
        //     d = d || a.realArea - b.realArea;
        //     d = d || a.area - b.area;
        //     return d;
        // });

        resultList.sort((a, b) => {
            let d = 0;
            d = d || a.area - b.area;
            d = d || a.binArea - b.binArea;
            d = d || a.realArea - b.realArea;
            return d;
        });

        const bestRsult = resultList[0];

        return ruleList[bestRsult._ruleIndex];
    }


    _findPositionForNewNodeShortSideFit(width, height, bestShortSideFit, bestLongSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();

        bestShortSideFit.value = Infinity;

        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let longSideFit;

        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);

                if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }

            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = Math.abs(rect.width - height);
                leftoverVert = Math.abs(rect.height - width);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);

                if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }
        }

        return bestNode;
    }

    _findPositionForNewNodeLongSideFit(width, height, bestShortSideFit, bestLongSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();

        bestLongSideFit.value = -Infinity;

        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let longSideFit;

        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);

                if (longSideFit > bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit > bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }

            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = Math.abs(rect.width - height);
                leftoverVert = Math.abs(rect.height - width);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);
                longSideFit = Math.max(leftoverHoriz, leftoverVert);

                if (longSideFit > bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit > bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestLongSideFit.value = longSideFit;
                }
            }
        }
        return bestNode;
    }

    _findPositionForNewNodeAreaFit(width, height, bestAreaFit, bestShortSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();

        bestAreaFit.value = Infinity;

        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;

        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            const areaFit = rect.width * rect.height - width * height;
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                leftoverHoriz = Math.abs(rect.width - width);
                leftoverVert = Math.abs(rect.height - height);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);

                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit = areaFit;
                }
            }

            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                leftoverHoriz = Math.abs(rect.width - height);
                leftoverVert = Math.abs(rect.height - width);
                shortSideFit = Math.min(leftoverHoriz, leftoverVert);

                if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestShortSideFit.value = shortSideFit;
                    bestAreaFit.value = areaFit;
                }
            }
        }

        return bestNode;
    }

    _findPositionForNewNodeBottomLeft(width, height, bestY, bestX) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();
        // memset(bestNode, 0, sizeof(Rectangle));

        bestY.value = Infinity;

        let topSideY;

        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                topSideY = rect.y + height;
                if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestY.value = topSideY;
                    bestX.value = rect.x;
                }
            }

            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                topSideY = rect.y + width;
                if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestY.value = topSideY;
                    bestX.value = rect.x;
                }
            }
        }
        return bestNode;
    }

    _findPositionForNewNodeContactPoint(width, height, bestContactScore) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();

        bestContactScore.value = -1;

        let score;

        for (let i = 0; i < freeRectangles.length; i++) {
            const rect = freeRectangles[i];
            // Try to place the Rectangle in upright (non-flipped) orientation.
            if (rect.width >= width && rect.height >= height) {
                score = this._contactPointScoreNode(rect.x, rect.y, width, height);
                if (score > bestContactScore.value) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = width;
                    bestNode.height = height;
                    bestContactScore = score;
                }
            }

            if (this.allowRotate && rect.width >= height && rect.height >= width) {
                score = this._contactPointScoreNode(rect.x, rect.y, height, width);
                if (score > bestContactScore.value) {
                    bestNode.x = rect.x;
                    bestNode.y = rect.y;
                    bestNode.width = height;
                    bestNode.height = width;
                    bestContactScore.value = score;
                }
            }
        }
        return bestNode;
    }

    _scoreRectangle(width, height, rule, score1, score2) {
        let newNode = new Rect();
        score1.value = Infinity;
        score2.value = Infinity;
        switch (rule) {
            case ShortSideFit:
                newNode = this._findPositionForNewNodeShortSideFit(width, height, score1, score2);
                break;
            case LongSideFit:
                newNode = this._findPositionForNewNodeLongSideFit(width, height, score2, score1);
                break;
            case AreaFit:
                newNode = this._findPositionForNewNodeAreaFit(width, height, score1, score2);
                break;
            case BottomLeft:
                newNode = this._findPositionForNewNodeBottomLeft(width, height, score1, score2);
                break;
            case ContactPoint:
                newNode = this._findPositionForNewNodeContactPoint(width, height, score1);
                // todo: reverse
                score1.value = -score1.value; // Reverse since we are minimizing, but for contact point score bigger is better.
                break;
            default:
                break;
        }

        // Cannot fit the current Rectangle.
        if (newNode.height === 0) {
            score1.value = Infinity;
            score2.value = Infinity;
        }

        return newNode;
    }

    _placeRectangle(node) {
        let numRectanglesToProcess = this.freeRectangles.length;
        for (let i = 0; i < numRectanglesToProcess; i++) {
            if (this._splitFreeNode(this.freeRectangles[i], node)) {
                this.freeRectangles.splice(i, 1);
                i--;
                numRectanglesToProcess--;
            }
        }

        this._pruneFreeList();
        this._mergeConnectedFreeRect();
        this._pruneFreeList();
        this.usedRectangles.push(node);
    }

    _splitFreeNode(freeNode, usedNode) {
        const freeRectangles = this.freeRectangles;
        // Test with SAT if the Rectangles even intersect.

        const outOfRight = usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x;
        const outOfBottom = usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y;

        if (outOfRight || outOfBottom) {
            return false;
        }

        let newNode;
        // if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
        // New node at the top side of the used node.
        // if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        if (usedNode.y > freeNode.y) {
            newNode = freeNode.clone();
            newNode.height = usedNode.y - newNode.y;
            freeRectangles.push(newNode);
        }

        // New node at the bottom side of the used node.
        if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
            newNode = freeNode.clone();
            newNode.y = usedNode.y + usedNode.height;
            newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
            freeRectangles.push(newNode);
        }
        // }

        // if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
        // New node at the left side of the used node.
        // if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        if (usedNode.x > freeNode.x) {
            newNode = freeNode.clone();
            newNode.width = usedNode.x - newNode.x;
            freeRectangles.push(newNode);
        }

        // New node at the right side of the used node.
        if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
            newNode = freeNode.clone();
            newNode.x = usedNode.x + usedNode.width;
            newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
            freeRectangles.push(newNode);
        }
        // }

        return true;
    }

    // / Returns 0 if the two intervals i1 and i2 are disjoint, or the length of their overlap otherwise.
    _commonIntervalLength(i1start, i1end, i2start, i2end) {
        if (i1end < i2start || i2end < i1start) {
            return 0;
        }
        return Math.min(i1end, i2end) - Math.max(i1start, i2start);
    }

    _contactPointScoreNode(x, y, width, height) {
        const usedRectangles = this.usedRectangles;
        let score = 0;

        if (x === 0 || x + width === this.maxWidth) score += height;
        if (y === 0 || y + height === this.maxHeight) score += width;
        let rect;
        for (let i = 0; i < usedRectangles.length; i++) {
            rect = usedRectangles[i];
            if (rect.x === x + width || rect.x + rect.width === x) score += this._commonIntervalLength(rect.y, rect.y + rect.height, y, y + height);
            if (rect.y === y + height || rect.y + rect.height === y) score += this._commonIntervalLength(rect.x, rect.x + rect.width, x, x + width);
        }
        return score;
    }

    _pruneFreeList() {
        const freeRectangles = this.freeRectangles;
        for (let i = 0; i < freeRectangles.length; i++) {
            for (let j = i + 1; j < freeRectangles.length; j++) {
                if (Rect.isContainedIn(freeRectangles[i], freeRectangles[j])) {
                    freeRectangles.splice(i, 1);
                    break;
                }
                if (Rect.isContainedIn(freeRectangles[j], freeRectangles[i])) {
                    freeRectangles.splice(j, 1);
                    j--;
                }
            }
        }
    }

    _mergeConnectedFreeRect(){
        const freeRectangles = this.freeRectangles;
        const origLen = freeRectangles.length;
        for (let i = 0; i < origLen; i++) {
	    const workTo = freeRectangles.length;
            for (let j = i + 1; j < workTo; j++) {
        	const outOfRight = freeRectangles[i].x > freeRectangles[j].x + freeRectangles[j].width || freeRectangles[i].x + freeRectangles[i].width < freeRectangles[j].x;
        	const outOfBottom = freeRectangles[i].y > freeRectangles[j].y + freeRectangles[j].height || freeRectangles[i].y + freeRectangles[i].height < freeRectangles[j].y;
		const isContained = Rect.isContainedIn(freeRectangles[i], freeRectangles[j]) || Rect.isContainedIn(freeRectangles[j], freeRectangles[i]);

	        if (!(outOfRight || outOfBottom || isContained)) {
        	    let newNode;

                    newNode = new Rect();
                    newNode.x = Math.min(freeRectangles[i].x, freeRectangles[j].x);
                    newNode.width = Math.max(freeRectangles[i].x + freeRectangles[i].width, freeRectangles[j].x + freeRectangles[j].width) - newNode.x;
                    newNode.y = Math.max(freeRectangles[i].y, freeRectangles[j].y);
		    newNode.height = Math.min(freeRectangles[i].y + freeRectangles[i].height, freeRectangles[j].y + freeRectangles[j].height) - newNode.y;
		    if(newNode.height > 0){
			let hasContained = false;
			for (let k = 0; k < freeRectangles.length; k++) {
			    hasContained |= Rect.isContainedIn(newNode, freeRectangles[k])
			}
			if(!hasContained){
                    	    freeRectangles.push(newNode);
			}
		    }	

                    newNode = new Rect();
                    newNode.x = Math.max(freeRectangles[i].x, freeRectangles[j].x);
                    newNode.width = Math.min(freeRectangles[i].x + freeRectangles[i].width, freeRectangles[j].x + freeRectangles[j].width) - newNode.x;
                    newNode.y = Math.min(freeRectangles[i].y, freeRectangles[j].y);
		    newNode.height = Math.max(freeRectangles[i].y + freeRectangles[i].height, freeRectangles[j].y + freeRectangles[j].height) - newNode.y;
		    if(newNode.width > 0 && !Rect.isContainedIn(newNode, freeRectangles[i]) && !Rect.isContainedIn(newNode, freeRectangles[j])){
			let hasContained = false;
			for (let k = 0; k < freeRectangles.length; k++) {
			    hasContained |= Rect.isContainedIn(newNode, freeRectangles[k])
			}
			if(!hasContained){
                    	    freeRectangles.push(newNode);
			}
		    }			
        	}
            }
        }        
    }

    _occupancy() {
        const usedRectangles = this.usedRectangles;
        let usedSurfaceArea = 0;
        for (let i = 0; i < usedRectangles.length; i++) {
            usedSurfaceArea += usedRectangles[i].width * usedRectangles[i].height;
        }

        return usedSurfaceArea / (this.maxWidth * this.maxHeight);
    }
}

