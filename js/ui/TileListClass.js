define(['js/ui/VirtualItemsView'], function (VirtualItemsView) {

    var AUTO = "auto";

    return VirtualItemsView.inherit('js.ui.TileListClass', {

        defaults: {
            heightUpdatePolicy: 'both',
            widthUpdatePolicy: 'both',

            width: null,
            /**
             * Extra class for the scroll container
             * @type String
             */
            scrollContainerClass: "",

            /**
             * The minimum size (width|height) of an item.
             * @type Number
             */
            minItemSize: 100,
            /**
             * The maximal size (width|height) of an item.
             * @type Number
             */
            maxItemSize: 150,

            /**
             * The width of an item. Default is "auto"
             */
            itemWidth: AUTO,
            /**
             * The height of an item. Default is "auto"
             * @type Number
             */
            itemHeight: AUTO,

            /**
             * The number of rows
             * @type Number
             */
            rows: AUTO,
            /**
             * The number of cols
             * @type Number
             */
            cols: AUTO,

            /**
             * calculates itemHeight, itemWidth if set to AUTO depending on the scrollDirection
             *
             * @type Number
             */
            aspectRatio: 1,

            horizontalGap: 10,
            /**
             * The vertical gap between the items
             * @type Number
             */
            verticalGap: 10,
            /**
             * The scrollBarSize is used to add a padding for the scrollbar so that it doesn't hide the items
             *
             * @type Number|String
             * */

            scrollBarSize: AUTO,

            _scrollBarSize: 0

        },

        _commitScrollBarSize: function (scrollBarSize) {
            if (scrollBarSize == AUTO) {
                /**
                 * Safari 3    15
                 * Firefox 3   17
                 * Chrome 2    17
                 * Opera 9    17
                 * Internet Explorer 7    17
                 * Internet Explorer 6    17
                 */
                var browser = this.$stage.$browser,
                    size = 20;
                if (browser.isMobile) {
                    size = 0;
                } else if (browser.os == "mac") {
                    size = 10;
                }

                this.set('_scrollBarSize', size, {silent: true});
            } else if (!isNaN(scrollBarSize)) {
                this.set('_scrollBarSize', scrollBarSize, {silent: true});
            }
        },

        _commitChangedAttributes: function ($) {

            if (this._hasSome($, ["itemWidth", "itemHeight", "aspectRation", "width", "height", "verticalGap", "horizontalGap"])) {

                var cols = this.$.cols,
                    rows = this.$.rows,
                    width = this.$.width,
                    height = this.$.height,
                    horizontalGap = this.$.horizontalGap,
                    verticalGap = this.$.verticalGap,
                    topPadding = this.$.topPadding,
                    leftPadding = this.$.leftPadding,
                    itemWidth = this.$.itemWidth,
                    itemHeight = this.$.itemHeight,
                    aspectRatio = this.$.aspectRatio,
                    scrollBarSize = this.$._scrollBarSize || 0,
                    setValues = true;

                if (width != null && this.$.scrollDirection === VirtualItemsView.SCROLL_DIRECTION_VERTICAL) {

                    if (cols === AUTO) {

                        if (itemWidth === AUTO) {
                            var minCols = (width - scrollBarSize - leftPadding - horizontalGap ) / (this.$.minItemSize + horizontalGap);
                            var maxCols = (width - scrollBarSize - leftPadding - horizontalGap ) / (this.$.maxItemSize + horizontalGap);
                            cols = Math.round((minCols + maxCols) / 2);
                        } else {
                            cols = Math.floor((width - horizontalGap) / (itemWidth + horizontalGap));
                        }
                    }

                    if (itemWidth === AUTO) {
                        itemWidth = Math.floor(((width - scrollBarSize - leftPadding) - (cols - 1) * horizontalGap) / cols);
                    }

                    if (itemHeight === AUTO) {
                        itemHeight = itemWidth * aspectRatio;
                    }
                } else if (height != null && this.$.scrollDirection === VirtualItemsView.SCROLL_DIRECTION_HORIZONTAL) {
                    if (rows === AUTO) {
                        if (itemHeight === AUTO) {
                            var minRows = (height - scrollBarSize - topPadding - verticalGap ) / (this.$.minItemSize + verticalGap);
                            var maxRows = (height - scrollBarSize - leftPadding - verticalGap ) / (this.$.maxItemSize + verticalGap);
                            rows = Math.round((minRows + maxRows) / 2);
                        } else {
                            rows = Math.floor((height - horizontalGap - topPadding) / (itemHeight + verticalGap));
                        }
                    }

                    if (itemHeight === AUTO) {
                        itemHeight = Math.floor(((height - scrollBarSize) - (rows - 1) * verticalGap) / rows);
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
                children = this.$templates['renderer'].createComponents({
                    $dataItem: null,
                    item: "{$dataItem.data}"
                });


            if (container) {
                // add all children to it
                var child;
                for (var i = 0; i < children.length; i++) {
                    child = children[i];
                    child.$classAttributes = child.$classAttributes || [];
                    child.$classAttributes.push("item");
                    container.addChild(child);

                }
                container.bind('change:$dataItem', function (e) {
                    var dataItem = e.$,
                        child;
                    for (var i = 0; i < children.length; i++) {
                        child = children[i];
                        child.set({
                            $dataItem: dataItem
                        });
                    }
                });
                ret = container;
            } else {
                ret = children[0];
            }

            ret && ret.set("position", "absolute");

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