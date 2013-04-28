define(["js/data/FilterView", "js/data/Query"], function(FilterView, Query) {
    return FilterView.inherit("js.data.QueryDataView", {

        defaults: {
            query: null
        },

        _filterItem: function (item, index) {

            var query = this.$.query;

            if (query) {
                return Query.ArrayExecutor._filterItem(item, query.where) == 1;
            }

            return true;
        }

    });
});