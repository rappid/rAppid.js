define(['js/core/Base'], function(Base) {

    return Base.inherit('js.data.TypeResolver', {
        /***
         *
         * @param {Object} value - the data from which the Entity-factory should be determined
         * @param type
         * @return {Function} returns a factory of js.core.Entity or null
         *
         * @abstract
         */
        resolve: function(value, type) {
            return null;
        }
    });

});