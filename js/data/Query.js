define(['Query'], function(Query){
    var Q = Query.inherit('js.data.Query',{

        /***
         *
         * @param items
         * @return {Array}
         */
        filterItems: function (items) {

            var expression = this.query.where(),
                ret = [];

            for (var i = 0; i < items.length; i++) {
                if (this._filterItem(items[i], expression)) {
                    ret.push(items[i]);
                }
            }

            return ret;
        },

        _filterItem: function (item, expression) {
            var ret = 1,
                operator = expression.operator;

            if (expression instanceof Query.Where) {
                var tmp;
                for (var i = 0; i < expression.expressions.length; i++) {
                    tmp = this._filterItem(item, expression);
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
                        for (var k in value) {
                            if (value.hasOwnProperty(k)) {
                                if (itemValue == value[k]) {
                                    return 1;
                                }
                            }
                        }
                        return 0;
                    case "between":
                        return itemValue >= value[0] && itemValue <= value[1];
                    case "like":
                        return new RegExp(value).test(itemValue);
                    case "ne":
                        return itemValue != value;
                    default :
                        return 1;
                }

            }

            return ret;
        },

        _getValueForItemField: function (item, field) {
            var path = field.split("."), value = item;
            while (path.length) {
                value = value[path.pop()];
            }
            return value;
        },

        /***
         *
         * @param items
         * @return {*}
         */
        sortItems: function (items) {
            var sortExpressions = this.query.sort,
                self = this;

            function compareExpression(a, b, expression) {
                var valueA = self._getValueForItemField(a, expression.field);
                var valueB = self._getValueForItemField(b, expression.field);
                if (valueA > valueB) {
                    return expression.direction;
                } else if (valueA < valueB) {
                    return -1 * expression.direction;
                } else {
                    return 0;
                }
            }

            return items.sort(function (a, b) {
                var sortExpression,
                    ret = 0;
                for (var i = 0; i < sortExpressions.length; i++) {
                    sortExpression = sortExpressions[i];
                    ret = compareExpression(a, b, sortExpression);
                    if (ret !== 0) {
                        return ret;
                    }
                }
                return ret;
            });
        }
    });

    Q.query = function(){
        return new Q();
    };

    return Q;
});