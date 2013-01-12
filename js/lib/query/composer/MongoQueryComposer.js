({define: typeof define != "undefined" ? define : function (deps, factory) {
    module.exports = factory(exports, require("../..").Query);
}}).define(["exports", "Query"], function (exports, Query) {

        var QuerytoMongoMap = {
            "lt": "$lt",
            "le": "$lte",
            "gt": "$gt",
            "ge": "$gte",
            "in": "$in",
            "ne": "$ne",
            "not": "$not",
            "all": "$all",
            "regex": "$regex"
        };

        var MongoComposer = {

            /**
             *
             * @param {Query} query
             * @return {Object}
             */
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
            /***
             *
             * @param {Array} sort
             * @return {Object}
             */
            translateSort: function(sort){
                var ret = {};
                sort = sort || [];
                for(var i = 0; i < sort.length; i++){
                    var sortElement = sort[i];
                    ret[sortElement.field] = sortElement.direction;
                }
                return ret;
            },

            /***
             *
             * @param {Object} operator
             * @return {Object}
             */
            translateOperator: function (operator) {
                var name = operator.operator,
                    ret = {},
                    field;
                if (name === "and" || name === "or") {
                    ret["$" + name] = this.translateExpressions(operator.expressions);
                } else if (name === "eql") {
                    field = operator.field;
                    ret[field] = operator.value;
                } else if (QuerytoMongoMap.hasOwnProperty(name)) {
                    field = operator.field;

                    ret[field] = {};
                    ret[field][QuerytoMongoMap[name]] = operator.value;
                } else if (name === "between") {
                    field = operator.field;
                    ret[field].$gt = operator.value[0];
                    ret[field].$lt = operator.value[1];
                } else {
                    throw new Error("Query Operator '" + name + "' is not supported!");
                }

                return ret;
            },

            /***
             *
             * @param {Array} expressions
             * @return {Array}
             */
            translateExpressions: function (expressions) {
                var ret = [];
                for (var i = 0; i < expressions.length; i++) {
                    var expression = expressions[i];
                    if (expression.operator) {
                        ret.push(this.translateOperator(expression));
                    } else if (expression instanceof Array) {
                        ret.push(this.translateExpressions(expression));
                    } else {
                        ret.push(expression);
                    }
                }
                return ret;
            }
        };

        exports.MongoQueryComposer = MongoComposer;

        return exports;
    });
