define(['js/ui/VirtualItemsView'], function (VirtualItemsView) {

    var AUTO = "auto";

    return VirtualItemsView.inherit('js.ui.TileListClass', {

        defaults: {
            heightUpdatePolicy: 'both',
            widthUpdatePolicy: 'both',
            width: null,
            scrollContainerClass: "",

            minItemSize: 100,
            maxItemSize: 150,

            itemWidth: AUTO,
            itemHeight: AUTO,

            rows: AUTO,
            cols: AUTO,

            // calculates itemHeight, itemWidth if set to AUTO depending on the scrollDirection
            aspectRatio: 1,

            horizontalGap: 10,
            verticalGap: 10

        },

        _commitChangedAttributes: function ($) {

            if (this._hasSome($, ["itemWidth", "itemHeight", "aspectRation", "width", "height", "verticalGap", "horizontalGap"])) {

                var cols = this.$.cols,
                    rows = this.$.rows,
                    width = this.$.width,
                    height = this.$.height,
                    horizontalGap = this.$.horizontalGap,
                    verticalGap = this.$.verticalGap,
                    itemWidth = this.$.itemWidth,
                    itemHeight = this.$.itemHeight,
                    aspectRatio = this.$.aspectRatio,
                    setValues = true;

                if (this.$.scrollDirection === VirtualItemsView.SCROLL_DIRECTION_VERTICAL) {

                    if (cols === AUTO) {

                        if (itemWidth === AUTO) {
                            var minCols = (width - horizontalGap ) / (this.$.minItemSize + horizontalGap);
                            var maxCols = (width - horizontalGap ) / (this.$.maxItemSize + horizontalGap);
                            cols = Math.round((minCols + maxCols) / 2);
                        } else {
                            cols = Math.floor((width - horizontalGap) / (itemWidth + horizontalGap));
                        }
                    }

                    if (itemWidth === AUTO) {
                        itemWidth = Math.floor((width - (cols - 1) * horizontalGap) / cols);
                    }

                    if (itemHeight === AUTO) {
                        itemHeight = itemWidth * aspectRatio;
                    }
                } else if (this.$.scrollDirection === VirtualItemsView.SCROLL_DIRECTION_HORIZONTAL) {
                    if (rows === AUTO) {
                        if (itemHeight === AUTO) {
                            var minRows = (height - verticalGap ) / (this.$.minItemSize + verticalGap);
                            var maxRows = (height - verticalGap ) / (this.$.maxItemSize + verticalGap);
                            rows = Math.round((minRows + maxRows) / 2);
                        } else {
                            rows = Math.floor((height - horizontalGap) / (itemHeight + verticalGap));
                        }
                    }

                    if (itemHeight === AUTO) {
                        itemHeight = Math.floor((height - (rows - 1) * verticalGap) / rows);
                    }

                    if (itemWidth === AUTO) {
                        itemWidth = itemHeight * aspectRatio;
                    }
                } else {
                    setValues = false;
                }

                setValues && this.set({
                    _itemHeight: itemHeight,
                    _itemWidth: itemWidth,
                    _cols: cols,
                    _rows: rows
                });
            }

            this.callBase();
        },

        _createRenderer: function (attributes) {
            attributes = attributes || {};
            attributes.$dataItem = null;

            var ret,
                container = this._createRenderContainer(attributes, this),
                children = this.$templates['renderer'].createComponents(null, container);

            if (container) {
                // add all children to it
                for (var i = 0; i < children.length; i++) {
                    container.addChild(children[i]);
                }
                ret = container;
            } else {
                ret = children[0];
            }

            ret && ret.set("position",  "absolute");

            return ret;
        },

        _createRenderContainer: function (attributes, parentScope) {
            var template = this.$templates['rendererContainer'];

            if (template) {
                var container = (template.createComponents(attributes, parentScope)[0]);
                container.$classAttributes.push('item');
                return container;
            }

            return null;
        }
    });

});