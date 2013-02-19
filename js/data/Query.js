define(['Query', 'js/lib/query/ArrayExecutor', 'js/core/Bindable'], function(Query, ArrayExecutor, Bindable){


    var Executor = ArrayExecutor.Executor,
        _getValueForItemField = Executor._getValueForItemField;


    Executor._getValueForItemField = function(item, field){
        if(item instanceof Bindable){
            return item.get(field);
        }

        return _getValueForItemField(item, field);
    };

    var Q = Query.inherit('js.data.Query',{
        ctor: Query,
        /***
         *
         * @param items
         * @return {Array}
         */
        filterItems: function (items) {
            return Executor.filterItems(this,items);
        },

        /***
         *
         * @param items
         * @return {*}
         */
        sortItems: function (items) {
            return Executor.sortItems(this, items);
        }
    });

    Q.query = function(){
        return new Q();
    };

    Q.Where = Query.Where;
    Q.Comparator = Query.Comparator;

    return Q;
});