(define = typeof define != "undefined" ? define : function (deps, factory) {
    var undefined;
    module.exports = factory(exports, require("..").Query);
    define = undefined;
});

define(["exports", "Query"], function (exports, Query) {


    var Executor = {
        /***
         *
         * @param query
         * @param items
         * @return {Array}
         */
        filterItems: function (query, items) {
            var expression = query.query.where,
                ret = [];

            for (var i = 0; i < items.length; i++) {
                if (this._filterItem(items[i], expression)) {
                    ret.push(items[i]);
                }
            }

            return ret;

        },

        /***
         *
         * @param item
         * @param expression
         * @return {*}
         * @private
         */
        _filterItem: function (item, expression) {
            var ret = 1,
                operator = expression.operator;

            if (expression instanceof Query.Where) {
                if (operator === "or") {
                    ret = 0;
                }
                var tmp;
                for (var i = 0; i < expression.expressions.length; i++) {
                    tmp = this._filterItem(item, expression.expressions[i]);
                    if (operator === "and") {
                        ret = ret * tmp;
                    } else if (operator === "or" && tmp) {
                        return 1;
                    } else if (operator === "not") {
                        return tmp ? 0 : 1;
                    }
                }
            } else if (expression instanceof Query.Comparator) {
                // TODO: add type check
                var value = expression.value,
                    field = expression.field,
                    itemValue = this._getValueForItemField(item, field);

                if (typeof(itemValue) === "undefined") {
                    return 0;
                }

                switch (operator) {
                    case "eql":
                        return itemValue == value;
                    case "gt":
                        return itemValue > value;
                    case "lt":
                        return itemValue < value;
                    case "gte":
                        return itemValue >= value;
                    case "lte":
                        return itemValue <= value;
                    case "in":
                        if (!(itemValue instanceof Array)) {
                            itemValue = [itemValue];
                        }
                        for (var j = 0; j < itemValue.length; j++) {
                            for (var k in value) {
                                if (value.hasOwnProperty(k)) {
                                    if (itemValue[j] == value[k]) {
                                        return 1;
                                    }
                                }
                            }
                        }
                        return 0;
                    case "between":
                        return itemValue >= value[0] && itemValue <= value[1];
                    case "like":
                        return new RegExp(value, "i").test(itemValue);
                    case "ne":
                        return itemValue != value;
                    default :
                        return 1;
                }

            }

            return ret;
        },

        /***
         *
         * @param item
         * @param field
         * @return {*}
         * @private
         */
        _getValueForItemField: function (item, field) {
            var path = field.split("."), value = item;
            while (path.length && typeof(value) !== "undefined") {
                value = value[path.shift()];
            }
            return value;
        },

        /***
         *
         * @param items
         * @param query
         * @return {*}
         */
        sortItems: function (query, items) {
            var sortExpressions = query.query.sort,
                self = this;

            if(sortExpressions){
                return items.sort(function (a, b) {
                    var sortExpression,
                        ret = 0;
                    for (var i = 0; i < sortExpressions.length; i++) {
                        sortExpression = sortExpressions[i];
                        ret = self._compareExpression(a, b, sortExpression);
                        if (ret !== 0) {
                            return ret;
                        }
                    }
                    return ret;
                });
            } else {
                return items;
            }

        },

        /***
         *
         * @param a
         * @param b
         * @param expression
         * @return {*}
         * @private
         */
        _compareExpression: function (a, b, expression) {
            var valueA = this._getValueForItemField(a, expression.field);
            var valueB = this._getValueForItemField(b, expression.field);
            if (valueA > valueB) {
                return expression.direction;
            } else if (valueA < valueB) {
                return -1 * expression.direction;
            } else {
                return 0;
            }
        }
    };

    exports.Executor = Executor;

    return exports;
});
