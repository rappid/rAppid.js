define(['js/ui/View', 'js/core/Bindable', 'js/core/List', 'js/data/Collection', 'underscore'], function (View, Bindable, List, Collection, _) {

    /***
     * defines an ItemsView which can show parts of data
     */
    var VirtualItemsView = View.inherit('js.ui.VirtualItemsView', {

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

            itemWidth: 100,
            itemHeight: 100,

            rows: 3,
            cols: 3,

            horizontalGap: 0,
            verticalGap: 0,

            prefetchItemCount: 0,

            fetchPageDelay: 500,

            $dataAdapter: null
        },

        $classAttributes: ['horizontalGap', 'verticalGap', 'prefetchItemCount', 'rows', 'cols', 'itemWidth', 'itemHeight', 'scrollLeft', 'scrollTop', 'fetchPageDelay'],

        ctor: function () {

            this.$activeRenderer = {};
            this.$availableRenderer = [];
            this.$container = null;

            this.callBase();

            this.createBinding('{$dataAdapter.size()}', this._itemsCountChanged, this);
            this.bind('change:scrollTop', this._updateVisibleItems, this);
            this.bind('change:scrollLeft', this._updateVisibleItems, this);
        },

        _initializeRenderer: function ($el) {
            var style = $el.getAttribute('style') || "";
            style = style.split(";");
            style.push('overflow: auto');
            $el.setAttribute('style', style.join(";"));
        },

        _bindDomEvents: function (el) {
            this.callBase();
            var self = this;

            this.bindDomEvent('scroll', function (e) {
                self.set({
                    scrollTop: self.$el.scrollTop,
                    scrollLeft: self.$el.scrollLeft
                });
            });
        },

        _initializationComplete: function() {
            this.callBase();

            this.$container = this._getScrollContainer();
            this._commitData(this.$.data);
        },

        _commitData: function (data) {

            if (!this.$initialized) {
                return;
            }

            // TODO
            /*

             if (_dataProviderChanged) {
             _dataProviderChanged = false;

             _scrollableContentHeightChanged = true;
             _offsetChanged = true;
             _layoutChanged = true;
             this.offset = 0;

             for (key in _activeRenderer) {
             if (_activeRenderer.hasOwnProperty(key)) {
             renderer = _activeRenderer[key] as IListItemRenderer;
             rendererDO = renderer as DisplayObject;

             if (renderer) {
             // release renderer

             dispatchEvent(new TileListEvent(TileListEvent.ITEM_SCROLLED_OUT_OF_VIEW, renderer.item));
             renderer.item = null;

             if (rendererDO && rendererDO.parent) {
             rendererDO.parent.removeChild(rendererDO);
             }

             // move render into free renderer collection
             _availableRenderer.push(rendererDO);
             }
             }
             }

             _activeRenderer = {};
             }

             */

            this.set('$dataAdapter', VirtualItemsView.createDataAdapter(data, this));

            // TODO: cleanup renderer
            this._updateVisibleItems();
        },


        _updateVisibleItems: function () {

            var dataAdapter = this.$.$dataAdapter;
            if (!dataAdapter) {
                return;
            }

            // check if some renderers can be released
            var scrollLeft = this.$.scrollLeft;
            var scrollTop = this.$.scrollTop;
            var startIndex = this.getIndexFromPoint(scrollLeft, scrollTop) - this.$.prefetchItemCount,
                endIndex = this.getIndexFromPoint(scrollLeft + this.$.width, scrollTop + this.$.height) + this.$.prefetchItemCount,
                renderer, i;


            startIndex = Math.max(0, startIndex);
            var ItemsCount = parseFloat(dataAdapter.size());

            if (!isNaN(ItemsCount)) {
                // end well known
                endIndex = Math.min(ItemsCount, endIndex)
            }
            console.log("CURRENT:", startIndex, endIndex);

            if (!(startIndex === this.$lastStartIndex && endIndex === this.$lastEndIndex)) {
                // some items are not visible any more or scrolled into view
                console.log("LAST:", this.$lastStartIndex, this.$lastEndIndex);
                // remember the last
                this.$lastStartIndex = startIndex;
                this.$lastEndIndex = endIndex;

                // release unused renderer
                for (var index in this.$activeRenderer) {
                    if (this.$activeRenderer.hasOwnProperty(index) && (index < startIndex || index > endIndex)) {
                        // render not in use
                        renderer = this.$activeRenderer[index];
                        if (renderer) {
                            renderer.set({
                                index: null,
                                data: null
                            });

                            renderer.remove();

                            this.$availableRenderer.push(renderer);
                        }

                        delete this.$activeRenderer[index];
                    }
                }

                var addedRenderer = [];

                for (i = startIndex; i <= endIndex; i++) {
                    renderer = this.$activeRenderer[i];

                    if (!renderer) {
                        // no renderer assigned to this item
                        renderer = this._reserveRenderer();
                        this.$activeRenderer[i] = renderer;
                        renderer.set({
                            width: this.$.itemWidth,
                            height: this.$.itemHeight,
                            $dataItem: dataAdapter.getItemAt(i),
                            $index: i,
                            $viewIndex: i - startIndex
                        });
                        this._addRenderer(renderer, renderer.$.$viewIndex);
                        addedRenderer.push(renderer);
                    }
                }

                for (i = 0; i < addedRenderer.length; i++) {
                    this._positionRenderer(addedRenderer[i], addedRenderer);
                }

                this._updatedVisibleItems(startIndex, endIndex);

            }


        },
        /***
         * @abstract
         * @param startIndex
         * @param endIndex
         * @private
         */
        _updatedVisibleItems: function(startIndex, endIndex){
            // HOOK for positions containers
        },
        _addRenderer: function (renderer, pos) {
            this.$container.addChild(renderer, {childIndex: pos});
        },

        _positionRenderer: function (renderer, addedRenderer) {

        },

        _reserveRenderer: function () {
            if (this.$availableRenderer.length) {
                return this.$availableRenderer.pop();
            }

            return this._createRenderer();
        },

        _createRenderer: function (attributes) {
            return this.$templates['renderer'].createComponents(attributes, this)[0];
        },

        _itemsCountChanged: function () {

            console.log("changed size");
            var size = this.getSizeForItemsCount(this.$.$dataAdapter.size());
            if (size) {
                this._getScrollContainer().set(size);
            }
        },
        getSizeForItemsCount: function (count) {
            if (isNaN(count) || count === 0) {
                return null;
            }
            var size = {}, itemRows = Math.floor(count / this.$.cols);

            size.height = itemRows * (this.$.itemHeight + this.$.verticalGap);

            // size.width = (this.$.cols * (this.$.itemWidth + this.$.horizontalGap)) || null;

            return size;
        },
        getIndexFromPoint: function (x, y, gapHPos, gapVPos) {
            var col, row;

            /* TODO: add gap position */
            /*
             position.x -= (gapHPos / 2) * horizontalGap;
             position.y -= (gapVPos / 2) * verticalGap;
             */

            x -= (this.$.horizontalGap);
            y -= (this.$.verticalGap);

            col = this.$.cols === 1 ? 0 : Math.floor(x / (this.$.itemWidth + this.$.horizontalGap));
            row = this.$.rows === 1 ? 0 : Math.floor(y / (this.$.itemHeight + this.$.verticalGap));

            return row * this.$.cols + col;


            /*
             private function getIndexFromAbsolutePosition(position:Point, gapHPos:int = RIGHT, gapVPos:int = BOTTOM):Number {

             if (new Rectangle(0, 0, this.width + 1, _scrollableContentHeight).containsPoint(position)) {



             var col:int = Math.floor(position.x / (_itemWidth + _horizontalGap));
             var row:int = Math.floor(position.y / (_itemHeight + _verticalGap));

             return row * _cols + col;
             }

             return Number.NaN;
             }

             */
        },

        getPointFromIndex: function (index) {

            var row = Math.floor(index / this.$.cols),
                col = index % this.$.cols;

            return {
                x: col * (this.$.itemWidth + this.$.horizontalGap),
                y: row * (this.$.itemHeight + this.$.verticalGap)
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

        defaults: {
            $data: null,
            $virtualItemsView: null
        },

        ctor: function (data, virtualItemsView) {

            if (data && !(data instanceof Array || data instanceof List)) {
                throw "data needs to be either an Array or a List"
            }

            this.callBase({
                $data: data,
                $virtualItemsView: virtualItemsView
            });
        },

        getItemAt: function (index) {
            var data = this.$.$data,
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
            return this.$.$data ? this.$.$data.length : 0;
        }.onChange('$data')
    });

    VirtualItemsView.VirtualCollectionDataAdapter = VirtualItemsView.VirtualDataAdapter.inherit('js.ui.VirtualItemsView.VirtualCollectionDataAdapter', {

        ctor: function (data) {

            if (data && !(data instanceof Collection)) {
                throw  "data needs to be a Collection";
            }

            // stores the waiting queue or true, if page already fetched
            this.$pages = {};
            this.$pageSize = data.$options.pageSize;

            this.callBase();
        },

        getItemAt: function (index) {
            console.log("getItemAt", index);

            // get the page from index
            var self = this,
                pageIndex = Math.floor(index / this.$pageSize),
                firstTimeToFetchPage = false;

            if (!this.$pages.hasOwnProperty(pageIndex)) {
                this.$pages[pageIndex] = {};
                firstTimeToFetchPage = true;
            }

            var pageEntry = this.$pages[pageIndex],
                dataItem = new (VirtualItemsView.DataItem)({
                    index: index,
                    data: null
                });

            if (pageEntry === true) {
                // page already fetched -> return with data
                dataItem.set('data',this.$.$data.at(index));
            } else {

                // add callback after fetch completes, which sets the data
                pageEntry[index] = function () {
                    dataItem.set('data', self.$.$data.at(index));
                };

                if (firstTimeToFetchPage) {

                    // first time -> start fetch delay
                    setTimeout(function () {

                        // delay passed -> check if at least on item of the page is needed
                        var pageStartIndex = pageIndex * self.$pageSize,
                            pageEndIndex = (pageIndex + 1) * self.$pageSize - 1;

                        var virtualItemsView = self.$.$virtualItemsView;

                        if (virtualItemsView.$lastStartIndex < pageEndIndex &&
                            virtualItemsView.$lastEndIndex > pageStartIndex) {

                            // we need to fetch the page
                            self.$.$data.fetchPage(pageIndex, null, function (err) {
                                if (err) {
                                    // delete page so it will be fetched again on scrolling
                                    delete self.$pages[pageIndex];
                                } else {
                                    // execute all callbacks
                                    var pageEntry = self.$pages[pageIndex];
                                    for (var key in pageEntry) {
                                        if (pageEntry.hasOwnProperty(key)) {
                                            (pageEntry[key])();
                                            delete pageEntry[key];
                                        }
                                    }

                                    // mark as already fetched
                                    self.$pages[pageIndex] = true;
                                }
                            });
                        } else {
                            // we don't need to fetch this page any more
                            delete self.$pages[pageIndex];
                        }

                    }, self.$.$virtualItemsView.$.fetchPageDelay);


                }
            }

            return dataItem;

        },


        /***
         * @returns {Number} the size of the list, or NaN if size currently unknown
         */
        size: function () {
            return this.$.$data ? this.$.$data.$.$itemsCount : NaN;
        }.on(['$data','change:$itemsCount'])
    });

    /***
     *
     * @class
     */
    VirtualItemsView.DataItem = Bindable.inherit('js.ui.VirtualItemsView.DataItem', {
        defaults: {
            // holds the index of the datasource, and is set by VirtualItemsView
            $index: null,
            // the data, which is set by the VirtualDataAdapter
            data: null
        }
    });


    return VirtualItemsView;
});