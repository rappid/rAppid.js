(define = typeof define != "undefined" ? define : function (deps, factory) {
    module.exports = factory(exports, require("../..").Query);
    define = undefined;
});

define(["exports", "Query"], function (exports, Query) {

    var comparatorMap = {
        "eql": "=",
        "gt": ">",
        "lt": "<",
        "lte": "<=",
        "gte": ">="
    }, undefined;

    var QueryComposer = {

        compose: function (query) {

            var hash = query.query,
                ret = {};

            if (hash.sort) {
                ret.sort = this.translateSort(hash.sort);
            }

            if (hash.where) {
                ret.where = this.translateOperator(hash.where)
            }

            return ret;
        },

        translateSort: function (sort) {
            var ret = [];
            for (var i = 0; i < sort.length; i++) {
                ret.push((sort[i].direction === 1 ? "+" : "-") + sort[i].field);
            }
            return ret.join(",");
        },

        translateOperator: function (operator, depth) {
            depth = depth === undefined ? 0 : depth;
            var name = operator.operator;
            if (operator instanceof Query.Where) {
                var expressions = this.translateExpressions(operator.expressions, depth + 1).join(" " + name + " ");
                if ((expressions.length && name !== "not" && depth !== 0)) {
                    expressions = "(" + expressions + ")";
                }
                if (name === "not") {
                    expressions = name + expressions;
                }
                return expressions;
            } else if (operator instanceof  Query.Comparator) {
                var value = operator.getValue();
                var type = typeof(value);
                if (type === "string") {
                    if (/^(\d+|false|true|null)$/.test(value)
                        || this.value === "false" || this.value === "true") {
                        value = type + ":" + value;
                    }
                }
                if (comparatorMap.hasOwnProperty(name)) {
                    return operator.field + comparatorMap[name] + value;
                } else if (operator.field && value !== undefined) {
                    if (value instanceof Array) {
                        value = "(" + operator.value.join(",") + ")";
                    }
                    return name + "(" + operator.field + "," + value + ")";
                }
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

    };

    exports.RestQueryComposer = QueryComposer;

    return exports;
});