define(["js/data/QueryMapper", "underscore"], function (QueryMapper, _) {

    var comparatorMap = {
        "eql": "=",
        "gt": ">",
        "lt": "<",
        "lte": "<=",
        "gte": ">="
    };

    return QueryMapper.inherit('js.data.mapper.RestQueryMapper', {

        compose: function (query) {

            var hash = query.toObject(),
                ret = {};

            if (hash.sort) {
                ret.sort = this.translateSort(hash.sort);
            }

            if (hash.where) {
                ret.where = this.translateOperator(hash.where);
            }

            return ret;
        },

        translateSort: function (sort) {
            return sort;
        },

        translateOperator: function (operator, depth) {
            depth = _.isUndefined(depth) ? 0 : depth;
            var name = operator.operator;
            if (name === "and" || name === "or") {
                var expressions = this.translateExpressions(operator.expressions, depth+1).join(" " + name + " ");
                if (expressions.length > 1 && depth !== 0) {
                    return "(" + expressions + ")";
                }
                return expressions;
            } else if (comparatorMap.hasOwnProperty(name)) {
                return operator.field + comparatorMap[name] + operator.value;
            } else if (operator.field && !_.isUndefined(operator.value)) {
                var value = operator.value;
                if (value instanceof Array) {
                    value = "(" + operator.value.join(",") + ")";
                }
                return name + "(" + operator.field + "," + value + ")";
            } else {
                return name;
            }
        },

        translateExpressions: function (expressions, depth) {
            var ret = [];
            for (var i = 0; i < expressions.length; i++) {
                ret.push(this.translateOperator(expressions[i], depth));
            }
            return ret;
        }

    });


});