    _findPositionForNewNodeShortSideFit(width, height, bestShortSideFit, bestLongSideFit) {
        const freeRectangles = this.freeRectangles;
        const bestNode = new Rect();

        bestShortSideFit.value = Infinity;

        let rect;
        let leftoverHoriz;
        let leftoverVert;
        let shortSideFit;
        let longSideFit;

        for (let i = 0; i < freeRectangles.length; i++) {
            rect = freeRectangles[i];
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
