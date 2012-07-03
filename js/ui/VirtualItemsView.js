define(['js/ui/View', 'js/core/Bindable', 'js/core/List', 'js/data/Collection'], function(View, Bindable, List, Collection) {

    /***
     * defines an ItemsView which can show parts of data
     */
    var VirtualItemsView = View.inherit('js.ui.VirtualItemsView', {

    });

    /***
     *
     */
    VirtualItemsView.VirtualDataAdapter = Bindable.inherit('js.ui.VirtualItemsView.VirtualDataAdapter', {

        ctor: function(data) {

        },

        getItemAt: function(index) {

        },

        /***
         * @returns {Number} the size of the list, or NaN if size currently unknown
         */
        size: function() {

        }
    });

    VirtualItemsView.VirtualCollectionDataAdapter = Bindable.inherit('js.ui.VirtualItemsView.VirtualCollectionDataAdapter', {

        ctor: function (data) {

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
    })


    return VirtualItemsView;
});