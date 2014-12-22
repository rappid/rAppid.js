define(['js/ui/View', 'js/core/Bindable', 'js/core/List', 'js/data/Collection', 'underscore'], function (View, Bindable, List, Collection, _) {
    var SELECTION_MODE_NONE = 'none',
        SELECTION_MODE_MULTI = 'multi',
        SELECTION_MODE_MUTLI_ALT = 'alt',
        SELECTION_MODE_SINGLE = 'single',

        SCROLL_DIRECTION_VERTICAL = "vertical",
        SCROLL_DIRECTION_HORIZONTAL = "horizontal";

    /***
     * defines an ItemsView which can show parts of data
     */
    var undefined,
        VirtualItemsView = View.inherit('js.ui.VirtualItemsView', {

            defaults: {

                // the data, which should be bound
                data: null,
                // TODO: update positions, after DOM Element scrollLeft and scrollTop changed
                // scroll positions
                scrollTop: 0,
                scrollLeft: 0,

                // TODO: update width and height, after DOM Element resized
                width: 300,
                height: 300,

                loading: false,

                _itemWidth: 100,
                _itemHeight: 100,

                _rows: 3,
                _cols: 3,
                scrollToIndex: 0,
                horizontalGap: 0,
                verticalGap: 0,
                scrollDirection: SCROLL_DIRECTION_VERTICAL,
                prefetchItemCount: 0,

                fetchPageDelay: 500,

                fetchWithFullData: false,

                $dataAdapter: null,
                selectionMode: SELECTION_MODE_MULTI,
                selectedItems: List,

                preventOuterScrolling: false,

                /**
                 * Top padding for scroll container
                 *
                 * @type Number
                 *
                 */
                topPadding: 0,
                /**
                 * Left Padding for scroll container
                 *
                 * @type Number
                 */
                leftPadding: 0
            },

            events: ["on:itemClick", "on:itemDblClick", "on:itemMouseOver", "on:itemMouseOut"],

            ctor: function () {
                this.$currentSelectionIndex = null;
                this.$selectionMap = {};
                this.$selectedViews = {};
                this.$activeRenderer = {};
                this.$availableRenderer = [];
                this.$container = null;
                this.$isLoading = false;
                this.callBase();

                this.createBinding('{$dataAdapter.size()}', this._itemsCountChanged, this);
            },

            initialize: function () {
                this.callBase();
                this.bind('selectedItems', 'reset', this._onSelectedItemsReset, this);

                this.bind('selectedItems', 'add', this._onSelectedItemsAdd, this);
                this.bind('selectedItems', 'remove', this._onSelectedItemsRemove, this);
            },

            _onSelectedItemsReset: function () {
                this._clearSelection();
            },

            _onSelectedItemsAdd: function (e) {
                var key = this.getSelectionKeyForItem(e.$.item);
                if (key) {
                    this.$selectionMap[key] = true;
                    this.trigger('selectionChanged');
                }
            },

            _onSelectedItemsRemove: function (e) {
                var key = this.getSelectionKeyForItem(e.$.item);
                if (key) {
                    delete this.$selectionMap[key];
                    this.trigger('selectionChanged');
                }
            },


            _isWebkitAndTouch: function () {
                var window = this.$stage.$window;
                return this.runsInBrowser() && window && window.hasOwnProperty("ontouchend") && /AppleWebKit/i.test(window.navigator.userAgent);
            },

            _initializeRenderer: function ($el) {
                var style = $el.getAttribute('style') || "";
                style = style.split(";");
                style.push('overflow: auto');
                style.push('-webkit-overflow-scrolling: touch;');

                $el.setAttribute('style', style.join(";"));
            },

            _onDomAdded: function () {
                this.callBase();
                this._syncScrollPosition();
            },

            _syncScrollPosition: function () {

                if (!this.isRendered()) {
                    return;
                }

                this.$el.scrollTop = this.$.scrollTop;
                this.$el.scrollLeft = this.$.scrollLeft;
            },

            _bindDomEvents: function (el) {
                this.callBase();
                var self = this;

                function mouseWheel(event) {

                    var delta = 0;
                    if (!event) /* For IE. */
                        event = self.$stage.$window.event;
                    if (event.wheelDelta) { /* IE/Opera. */
                        delta = event.wheelDelta / 120;
                    } else if (event.detail) { /** Mozilla case. */
                        /** In Mozilla, sign of delta is different than in IE.
                         * Also, delta is multiple of 3.
                         */
                        delta = -event.detail / 3;
                    }

                    var scrollTop = self.$el.scrollTop,
                        height = self.$el.offsetHeight,
                        scrollHeight = self.$el.scrollHeight;

                    var d = delta;

                    if ((scrollTop >= (scrollHeight - height) && d < 0) || (scrollTop <= 0 && d > 0)) {
                        event.preventDefault();
                    }
                }

                function scroll() {
                    self.set({
                        scrollTop: self.$el.scrollTop,
                        scrollLeft: self.$el.scrollLeft
                    });
                }

                this.bindDomEvent('scroll', scroll);

                if (this.$.preventOuterScrolling) {
                    this.bindDomEvent("DOMMouseScroll", mouseWheel, false);
                    this.bindDomEvent('mousewheel', mouseWheel, false);
                }
            },

            _mouseMove: function (e) {

                var dataAdapter = this.$.$dataAdapter;

                if (!dataAdapter) {
                    return;
                }

                var localPoint = this.globalToLocal({
                    x: e.clientX + this.$el.scrollLeft,
                    y: e.clientY + this.$el.scrollTop
                });

                var indexFromPoint = this.getIndexFromPoint(localPoint.x, localPoint.y);
                var item = dataAdapter.getItemAt(indexFromPoint);

                if (item) {
                    item = item.$.data;
                }
            },

            render: function () {
                var el = this.callBase();
                this._updateVisibleItems();
                return el;
            },

            _initializationComplete: function () {
                this.callBase();
                this.$container = this._getScrollContainer();
                this._commitData(this.$.data);
            },

            _commitData: function (data) {
                if (!this.$initialized) {
                    return;
                }
                this.set('$dataAdapter', VirtualItemsView.createDataAdapter(data, this));
                // reset indecies
                this.$lastEndIndex = null;
                this.$lastStartIndex = null;
                this.$currentSelectionIndex = -1;

                // clear active renderer and scroll to top
                this._releaseActiveRenderer();
                this.set('loading', true);
                this._scrollToIndex(0);
                this._updateVisibleItems();
            },

            _renderLoading: function (loading) {
                if (loading) {
                    this.addClass("loading");
                } else {
                    this.removeClass("loading");
                }
            },

            _commitChangedAttributes: function (attributes, opt) {
                if (!_.isUndefined(attributes.scrollToIndex) && opt.initiator !== this) {
                    this._scrollToIndex(attributes.scrollToIndex);
                }

                if (this._hasSome(attributes, ['_itemWidth', '_itemHeight', 'verticalGap', 'horizontalGap', '_cols', '_rows'])) {
                    this._positionActiveRenderers();
                    this._updateSize();
                    this._scrollToIndex(this.$.scrollToIndex);
                }

                if (this._hasSome(attributes, ['scrollTop', 'scrollLeft', 'height', 'width'])) {
                    this._updateVisibleItems();
                }

                this.callBase();
                // TODO: data provider change
                // TODO: cleanup renderer
            },

            _updateVisibleItems: function (forceRefresh) {
                if (this.isRendered()) {
                    var dataAdapter = this.$.$dataAdapter;
                    if (!dataAdapter) {
                        return;
                    }
                    // check if some renderers can be released
                    var scrollLeft = this.$.scrollLeft,
                        scrollTop = this.$.scrollTop,
                        realStartIndex = this.getIndexFromPoint(scrollLeft, scrollTop),
                        startIndex = realStartIndex - this.$.prefetchItemCount,
                        realEndIndex = this.getIndexFromPoint(scrollLeft + this.$.width, scrollTop + this.$.height),
                        endIndex = realEndIndex + this.$.prefetchItemCount,
                        renderer, i, pageIndex;

                    realStartIndex = Math.max(0, realStartIndex);
                    if ((realStartIndex > this.$.scrollToIndex || realStartIndex + this.$._cols < this.$.scrollToIndex)) {
                        this.set('scrollToIndex', realStartIndex, {initiator: this});
                    }

                    startIndex = Math.max(0, startIndex);
                    var ItemsCount = parseFloat(dataAdapter.size());

                    if (!isNaN(ItemsCount)) {
                        // end well known
                        if (ItemsCount <= 0) {
                            this._releaseActiveRenderer();
                        }
                        endIndex = Math.min(ItemsCount - 1, endIndex);

                        this.set('loading', false);
                    }

                    if (forceRefresh || !(startIndex === this.$lastStartIndex && endIndex === this.$lastEndIndex)) {

                        // some items are not visible any more or scrolled into view
                        // remember the last
                        this.$lastStartIndex = startIndex;
                        this.$lastEndIndex = endIndex;

                        this._releaseActiveRenderer(startIndex, endIndex);

                        var addedRenderer = [];

                        for (i = startIndex; i <= endIndex; i++) {
                            renderer = this.$activeRenderer[i];

                            if (!renderer) {
                                // no renderer assigned to this item
                                renderer = this._reserveRenderer();
                                this.$activeRenderer[i] = renderer;

                                renderer.set({
                                    width: this.$._itemWidth,
                                    height: this.$._itemHeight,
                                    $dataItem: dataAdapter.getItemAt(i),
                                    $index: i,
                                    $viewIndex: i - startIndex
                                });

                                this._addRenderer(renderer, renderer.$.$viewIndex);
                                addedRenderer.push(renderer);
                            } else if (forceRefresh) {
                                renderer.set("$dataItem", dataAdapter.getItemAt(i));
                            }
                        }

                        for (i = 0; i < addedRenderer.length; i++) {
                            this._positionRenderer(addedRenderer[i], addedRenderer);
                        }

                        this._onVisibleItemsUpdated(startIndex, endIndex);

                    }
                }
            },

            /***
             *
             * Releases all renderer outside the given indecies
             * If no indecies are given, all renderer are released
             * @param [startIndex] the max startIndex
             * @param [endIndex] the min endIndex
             * @private
             */
            _releaseActiveRenderer: function (startIndex, endIndex) {
                if (_.isUndefined(startIndex)) {
                    startIndex = Number.MAX_VALUE;
                }
                if (_.isUndefined(endIndex)) {
                    endIndex = -1;
                }
                var renderer;
                // release unused renderer
                for (var index in this.$activeRenderer) {
                    if (this.$activeRenderer.hasOwnProperty(index) && (index < startIndex || index > endIndex)) {
                        // render not in use
                        renderer = this.$activeRenderer[index];
                        if (renderer) {
                            renderer.set({
                                $index: null,
                                $dataItem: null
                            });

                            renderer.remove();

                            this.$availableRenderer.push(renderer);
                        }

                        delete this.$activeRenderer[index];
                    }
                }
            },
            /***
             * @abstract
             * @param startIndex
             * @param endIndex
             * @private
             */
            _onVisibleItemsUpdated: function (startIndex, endIndex) {
                // HOOK for positions containers
            },

            _addRenderer: function (renderer, pos) {
                this.$container.addChild(renderer, {childIndex: pos});
            },

            _positionRenderer: function (renderer, addedRenderer) {
                var point = this.getPointFromIndex(renderer.$.$index);
                renderer.set({
                    left: point.x,
                    top: point.y
                });
            },

            _scrollToIndex: function (index) {
                this.$scrollToIndexPos = this.getPointFromIndex(index);
                var scrollTop = this.$scrollToIndexPos.y;
                if (this.isRendered()) {
                    this.$el.scrollTop = scrollTop;
                }
                this.set('scrollTop', scrollTop);
            },

            _reserveRenderer: function () {
                if (this.$availableRenderer.length) {
                    return this.$availableRenderer.shift();
                }
                var renderer = this._createRenderer();
                renderer.bind('on:dblclick', this._onRendererDblClick, this);
                renderer.bind('on:click', this._onRendererClick, this);
                return renderer;
            },

            _onRendererClick: function (e, renderer) {
                this.trigger('on:itemClick', e, renderer);
                if (!e.isDefaultPrevented) {
                    this._selectItem(renderer.$.$index, e.domEvent.shiftKey, e.domEvent.metaKey);
                }
            },

            _onRendererDblClick: function (e, renderer) {
                this.trigger('on:itemDblClick', e, renderer);
            },

            _createRenderer: function (attributes) {
                return this.$templates['renderer'].createComponents(attributes, this)[0];
            },

            _positionActiveRenderers: function () {
                for (var index in this.$activeRenderer) {
                    if (this.$activeRenderer.hasOwnProperty(index)) {
                        this.$activeRenderer[index].set({width: this.$._itemWidth, height: this.$._itemHeight});
                        this._positionRenderer(this.$activeRenderer[index], []);
                    }
                }
            },
            _updateSize: function () {
                if (this.$.$dataAdapter) {
                    var size = this.getSizeForItemsCount(this.$.$dataAdapter.size());
                    if (size) {
                        this._getScrollContainer().set(size);
                        this._syncScrollPosition();
                    }
                }
            },
            _itemsCountChanged: function () {
                this._updateSize();
                this._updateVisibleItems();
            },

            getSizeForItemsCount: function (count) {
                if (isNaN(count)) {
                    return null;
                }
                var size = {},
                    topPadding = this.$.topPadding,
                    leftPadding = this.$.leftPadding;

                if (this.$.scrollDirection === SCROLL_DIRECTION_VERTICAL) {
                    var item_rows = Math.ceil(count / this.$._cols);
                    size.height = item_rows * (this.$._itemHeight + this.$.verticalGap) + topPadding;
                } else if (this.$.scrollDirection === SCROLL_DIRECTION_HORIZONTAL) {
                    var item_cols = Math.ceil(count / this.$._rows);
                    size.width = item_cols * (this.$._itemWidth + this.$.horizontalGap) + leftPadding;
                }

                return size;
            },

            getIndexFromPoint: function (x, y, gapHPos, gapVPos) {
                var col, row;

                /* TODO: add gap position */
                /*
                 position.x -= (gapHPos / 2) * horizontalGap;
                 position.y -= (gapVPos / 2) * verticalGap;
                 */
                x += (this.$.horizontalGap) * 0.5;
                y += (this.$.verticalGap) * 0.5;

                col = this.$._cols === 1 ? 0 : Math.floor((x - this.$.leftPadding) / (this.$._itemWidth + this.$.horizontalGap));
                row = this.$._rows === 1 ? 0 : Math.floor((y - this.$.topPadding) / (this.$._itemHeight + this.$.verticalGap));

                if (this.$.scrollDirection === SCROLL_DIRECTION_VERTICAL) {
                    return row * this.$._cols + col;
                } else if (this.$.scrollDirection === SCROLL_DIRECTION_HORIZONTAL) {
                    return col * this.$._rows + row;
                }

            },

            getPointFromIndex: function (index) {
                var row, col,
                    topPadding = this.$.topPadding || 0,
                    leftPadding = this.$.leftPadding || 0;
                if (this.$.scrollDirection === SCROLL_DIRECTION_VERTICAL) {
                    row = Math.floor(index / this.$._cols);
                    col = index % this.$._cols;
                } else if (this.$.scrollDirection === SCROLL_DIRECTION_HORIZONTAL) {
                    col = Math.floor(index / this.$._rows);
                    row = index % this.$._rows;
                }

                return {
                    x: leftPadding + col * (this.$._itemWidth + this.$.horizontalGap),
                    y: topPadding + row * (this.$._itemHeight + this.$.verticalGap)
                };


            },

            /***
             *
             * @abstract
             * @param {Element} el
             * @returns {js.core.DomElement}
             * @private
             */
            _getScrollContainer: function () {

                var scrollContainer = this.get('$scrollContainer');

                if (!scrollContainer) {
                    throw "implement _getScrollContainer or set cid='$scrollContainer'";
                }

                return scrollContainer;

            },

            _renderSelectionMode: function (mode) {
                if (mode !== SELECTION_MODE_NONE) {
                    this.$el.setAttribute('tabindex', '1');
                }
            },

            /***
             * handles key down
             * @param e
             * @private
             */
            _onKeyDown: function (e) {
                var keyCode = e.domEvent.keyCode;
                if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39) {
                    var index = this.$currentSelectionIndex !== null ? this.$currentSelectionIndex : -1;
                    var indexOffset;
                    if (this.$.scrollDirection === SCROLL_DIRECTION_VERTICAL) {
                        indexOffset = this.$._cols;
                    } else {
                        indexOffset = this.$._rows;
                    }
                    switch (keyCode) {
                        case 38:
                            index -= this.$._cols;
                            break;
                        case 40:
                            index += this.$._cols;
                            break;
                        case 37:
                            index--;
                            break;
                        case 39:
                            index++;
                            break;
                        default:
                            void 0;
                    }
                    if (index < 0) {
                        index = 0;
                    }
                    if (this.$.$dataAdapter && index >= this.$.$dataAdapter.size()) {
                        index = this.$.$dataAdapter.size() - 1;
                    }
                    this._selectItem(index, e.domEvent.shiftKey, false);
                    e.preventDefault();
                    e.stopPropagation();
                }
            },

            /***
             * deselect all elements
             * @private
             */
            _clearSelection: function () {
                for (var key in this.$selectionMap) {
                    if (this.$selectionMap.hasOwnProperty(key)) {
                        delete this.$selectionMap[key];
                    }
                }
                if (!this.$.selectedItems.isEmpty()) {
                    this.$.selectedItems.clear({silent: true});
                }
                this.$currentSelectionIndex = -1;

                this.trigger('selectionChanged');
            },

            /***
             * selects the item
             * @param index
             * @param shiftDown
             * @param metaKey
             * @private
             */
            _selectItem: function (index, shiftDown, metaKey) {

                switch (this.$.selectionMode) {
                    case SELECTION_MODE_NONE:
                        return;
                    case SELECTION_MODE_SINGLE:
                        shiftDown = false;
                        metaKey = false;
                        break;
                    case SELECTION_MODE_MUTLI_ALT:
                        metaKey = true;
                        break;
                }

                if (!metaKey) {
                    this._clearSelection();
                }

                if (!shiftDown || metaKey) {
                    this.$lastSelectionIndex = index;
                }
                var startIndex, endIndex;
                if (this.$lastSelectionIndex !== undefined && index < this.$lastSelectionIndex) {
                    startIndex = index;
                    endIndex = this.$lastSelectionIndex;
                } else {
                    startIndex = this.$lastSelectionIndex;
                    endIndex = index;
                }
                this.$currentSelectionIndex = index;
                var item, id;
                for (var i = startIndex; i <= endIndex; i++) {
                    item = this.$.$dataAdapter.getItemAt(i);

                    id = null;

                    if (item) {
                        id = this.getSelectionKeyForItem(item.$.data)
                    }

                    if (id) {
                        if (metaKey && this.$selectionMap[id]) {
                            delete this.$selectionMap[id];
                            this.$.selectedItems.remove(item.$.data);
                        } else {
                            this.$selectionMap[id] = true;
                            this.$.selectedItems.add(item.$.data);

                        }
                    } else {
                        this.log("no id defined for data item", "warn");
                    }
                }
                var pos = this.getPointFromIndex(index);
                if (this.$.scrollDirection === SCROLL_DIRECTION_VERTICAL) {
                    var y = pos.y, topDiff = y - this.$el.scrollTop, bottomDiff = topDiff + this.$._itemHeight + this.$.verticalGap - this.$.height;
                    topDiff -= this.$.verticalGap;
                    if (bottomDiff > 0) {
                        this.$el.scrollTop += bottomDiff;
                    }
                    if (topDiff < 0) {
                        this.$el.scrollTop += topDiff;
                    }
                } else {
                    var x = pos.x, leftDiff = x - this.$el.scrollLeft, rightDiff = leftDiff + this.$._itemWidth + this.$.horizontalGap - this.$.width;
                    leftDiff -= this.$.horizontalGap;
                    if (rightDiff > 0) {
                        this.$el.scrollLeft += rightDiff;
                    }
                    if (leftDiff < 0) {
                        this.$el.scrollLeft += leftDiff;
                    }
                }
                if (!shiftDown) {
                    this.$lastSelectionIndex = index;
                }
            },

            /***
             * determinate if the item is selected
             * @return {Boolean}
             */
            isItemSelected: function (data) {
                var key = this.getSelectionKeyForItem(data);
                if (key) {
                    return this.$selectionMap[key] !== undefined;
                }
                return false;
            }.on("selectionChanged"),


            getSelectionKeyForItem: function (item) {
                if (!item) {
                    return false;
                }
                var key;
                if (item.identifier) {
                    return item.identifier();
                } else if (_.isString(item)) {
                    return item;
                } else {
                    key = this.get(item, "id");
                    if (key) {
                        return key;
                    }
                }

                return false;
            },

            /***
             * sorts the bound dataAdapter
             * @param sortParameter
             */
            sort: function (sortParameter) {
                var dataAdapter = this.$.$dataAdapter;
                dataAdapter && dataAdapter.sort(sortParameter);
            },

            query: function (query) {
                var dataAdapter = this.$.$dataAdapter;
                dataAdapter && dataAdapter.query(query);
            }

        }, {
            createDataAdapter: function (data, virtualItemsView) {

                if (data instanceof Collection) {
                    return new (VirtualItemsView.VirtualCollectionDataAdapter)(data, virtualItemsView);
                } else if (data instanceof List || data instanceof Array) {
                    return new (VirtualItemsView.VirtualDataAdapter)(data, virtualItemsView);
                }

                return null;
            }
        });

    /***
     *
     */
    VirtualItemsView.VirtualDataAdapter = Bindable.inherit('js.ui.VirtualItemsView.VirtualDataAdapter', {

        ctor: function (data, virtualItemsView) {

            if (data && !(data instanceof Array || data instanceof List)) {
                throw new Error("data needs to be either an Array or a List");
            }

            this.$data = data;
            this.$virtualItemsView = virtualItemsView;

            if (data instanceof List && !(data instanceof Collection)) {

                var refreshView = function (e) {

                    var force = true;

                    if (e.type == "add" && e.$.index >= data.length - 1) {
                        // added to the end
                        force = false;
                    }

                    this.trigger('sizeChanged');
                    if (e.type == "reset") {
                        virtualItemsView._scrollToIndex(0);
                    }
                    virtualItemsView._updateVisibleItems(force);
                };

                data.bind('add', refreshView, this);
                data.bind('remove', refreshView, this);
                data.bind('reset', refreshView, this);
                data.bind('sort', refreshView, this);
            }


            this.callBase(null);

        },

        getItemAt: function (index) {
            var data = this.$data,
                dataItem = null;

            if (data instanceof Array) {
                dataItem = data[index];
            } else if (data instanceof List) {
                dataItem = data.$items[index];
            }

            if (dataItem) {
                dataItem = new (VirtualItemsView.DataItem)({
                    index: index,
                    data: dataItem
                });
            }

            return dataItem;
        },
        /***
         * @returns {Number} the size of the list
         */
        size: function () {
            return this.$data ? this.$data.length : 0;
        }.on("sizeChanged", "change:$data")
    });

    VirtualItemsView.VirtualCollectionDataAdapter = VirtualItemsView.VirtualDataAdapter.inherit('js.ui.VirtualItemsView.VirtualCollectionDataAdapter', {

        ctor: function (data) {

            if (data && !(data instanceof Collection)) {
                throw  "data needs to be a Collection";
            }

            // stores the waiting queue or true, if page already fetched
            this.$pages = {};
            this.$cache = {};
            this.$pageSize = data.$.pageSize;

            this.callBase();

            // watch the reset event for invalidation ...
            data.bind('reset', this._onReset, this);

            this.$collectionSizeUnknown = isNaN(this.size);
        },
        _onReset: function () {
            this.$pages = {};
            this.$cache = {};
            this.$collectionSizeUnknown = true;

            // force view refresh
            this.$virtualItemsView._updateVisibleItems(true);
        },
        getItemAt: function (index) {
            // get the page from index
            var self = this,
                pageIndex = Math.floor(index / this.$pageSize),
                firstTimeToFetchPage = false,
                dataItem = this.$cache[index];

            if (!this.$pages.hasOwnProperty(pageIndex)) {
                this.$pages[pageIndex] = {};
                firstTimeToFetchPage = true;
            }

            if (!dataItem) {
                dataItem = new (VirtualItemsView.DataItem)({
                    index: index,
                    data: null,
                    $status: STATUS_LOADING
                });
                this.$cache[index] = dataItem;
            }

            var pageEntry = this.$pages[pageIndex];

            if (pageEntry === true) {
                dataItem.set('$status', STATUS_LOADED);
                // page already fetched -> return with data
                dataItem.set('data', this.$data.at(index));
            } else if (pageEntry && index >= 0) {
                dataItem.set('$status', STATUS_LOADING);
                // add callback after fetch completes, which sets the data
                pageEntry[index] = dataItem;

                if (firstTimeToFetchPage) {

                    (function (pageIndex) {
                        // first time -> start fetch delay
                        setTimeout(function () {

                            // delay passed -> check if at least on item of the page is needed
                            var pageStartIndex = pageIndex * self.$pageSize,
                                pageEndIndex = (pageIndex + 1) * self.$pageSize - 1;

                            var virtualItemsView = self.$virtualItemsView;

                            if (virtualItemsView.$lastStartIndex <= pageEndIndex &&
                                virtualItemsView.$lastEndIndex >= pageStartIndex) {

                                // we need to fetch the page
                                self.$data.fetchPage(pageIndex, {
                                    fullData: self.$virtualItemsView.$.fetchWithFullData
                                }, function (err) {
                                    if (err) {
                                        // delete page so it will be fetched again on scrolling
                                        delete self.$pages[pageIndex];
                                    } else {
                                        // execute all callbacks
                                        var pageEntry = self.$pages[pageIndex];
                                        for (var key in pageEntry) {
                                            if (pageEntry.hasOwnProperty(key)) {
                                                pageEntry[key].set({
                                                    data: self.$data.at(key),
                                                    $status: STATUS_LOADED
                                                });
                                                pageEntry[key] = undefined;
                                            }
                                        }

                                        // mark as already fetched
                                        self.$pages[pageIndex] = true;

                                        if (self.$collectionSizeUnknown) {
                                            // after the successfully fetch the size of the collection should be
                                            // known -> update the VirtualItemsView
                                            self.$collectionSizeUnknown = false;
                                            self.$virtualItemsView._updateVisibleItems();
                                        }
                                    }
                                });
                            } else {
                                // we don't need to fetch this page any more
                                self.$pages[pageIndex] = undefined;
                            }

                        }, self.$virtualItemsView.$.fetchPageDelay);
                    })(pageIndex);


                }
            }

            return dataItem;

        },

        sort: function (query) {
            // TODO: clean up old sortCollection or add caching

            var sortCollection = this.$data.sort(query);
            this.$sortCollection = sortCollection;

            this.$virtualItemsView.set('data', sortCollection);
        },

        query: function (query) {
            // TODO: clean up sort collection
            var queryCollection = this.$data.query(query);
            this.$queryCollection = queryCollection;

            this.$virtualItemsView.set('data', queryCollection);
        },

        /***
         * @returns {Number} the size of the list, or NaN if size currently unknown
         */
        size: function () {
            return this.$data ? this.$data.$.$itemsCount : NaN;
        }.on(['$data', 'change:$itemsCount'])
    });

    var STATUS_EMPTY = "empty",
        STATUS_LOADING = "loading",
        STATUS_LOADED = "loaded";

    VirtualItemsView.DataItem = Bindable.inherit('js.ui.VirtualItemsView.DataItem', {
        defaults: {
            // holds the index of the datasource, and is set by VirtualItemsView
            $index: null,
            // loading status
            status: STATUS_EMPTY,
            selected: false,
            // the data, which is set by the VirtualDataAdapter
            data: null
        }
    });

    VirtualItemsView.SCROLL_DIRECTION_VERTICAL = SCROLL_DIRECTION_VERTICAL;
    VirtualItemsView.SCROLL_DIRECTION_HORIZONTAL = SCROLL_DIRECTION_HORIZONTAL;

    return VirtualItemsView;
});