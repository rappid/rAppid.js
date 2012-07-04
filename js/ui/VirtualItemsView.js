define(['js/ui/View', 'js/core/Bindable', 'js/core/List', 'js/data/Collection', 'underscore'], function(View, Bindable, List, Collection, _) {

    /***
     * defines an ItemsView which can show parts of data
     */
    var VirtualItemsView = View.inherit('js.ui.VirtualItemsView', {

        defaults: {

            // the data, which should be bound
            data: null,

            // TODO: update positions, after DOM Element scrollLeft and scrollTop changed
            // scroll positions
            $scrollX: 0,
            $scrollY: 0,

            // TODO: update width and height, after DOM Element resized
            height: 300,
            width: 300,

            $dataAdapter: null
        },

        ctor: function () {
            this.callBase();

            this.createBinding('{$dataAdapter.size()}', this._itemsCountChanged, this);
        },

        _commitData: function (data) {
            this.set('$dataAdapter', VirtualItemsView.createDataAdapter(data));
        },

        _itemsCountChanged: function() {
            console.log('itemsCount changed', this.get('$dataAdapter.size()'))
        },


        /***
         *
         * @param {Number} itemCount the number of items available
         * @private
         */
        _calculateScrollDimensions: function(itemCount) {

        },

        getIndexFromPoint: function(x, y) {

        },

        getPointFromIndex: function(index) {

        }

    }, {
        createDataAdapter: function (data) {

            if (data instanceof Collection) {
                return new VirtualItemsView.VirtualCollectionDataAdapter(data);
            } else if (data instanceof List || data instanceof Array) {
                return new VirtualItemsView.VirtualDataAdapter(data);
            }

            return null;
        }
    });

    /***
     *
     */
    VirtualItemsView.VirtualDataAdapter = Bindable.inherit('js.ui.VirtualItemsView.VirtualDataAdapter', {

        defaults: {
            $data: null
        },

        _initializeRenderer: function ($el) {
            // create scroll panel
            this.$scroll = this._createDomElement('div');

        },

        ctor: function(data) {

            this.callBase();

            if (data && !(data instanceof Array || data instanceof List)) {
                throw "data needs to be either an Array or a List"
            }

            this.set('$data', data);
        },

        getItemAt: function(index) {
            var data = this.$.$data;

            if (data instanceof Array) {
                return data[index];
            } else if (data instanceof List) {
                return data.$items[index];
            }

            return null;
        },

        /***
         * @returns {Number} the size of the list, or NaN if size currently unknown
         */
        size: function() {
            return this.$.$data ? this.$.$data.length : 0;
        }.onChange('$data')
    });

    VirtualItemsView.VirtualCollectionDataAdapter = Bindable.inherit('js.ui.VirtualItemsView.VirtualCollectionDataAdapter', {

        ctor: function (data) {
            this.callBase();
        },

        getItemAt: function (index) {

        },

        size: function () {

        }
    });

    /***
     *
     * @class
     */
    VirtualItemsView.DataItem = Bindable.inherit('js.ui.VirtualItemsView.DataItem', {
        defaults: {
            // holds the index of the datasource, and is set by VirtualItemsView
            index: null,
            // the data, which is set by the VirtualDataAdapter
            data: null
        }
    });


    return VirtualItemsView;
});