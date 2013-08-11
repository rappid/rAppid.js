(define = typeof define != "undefined" ? define : function (deps, factory) {
    var undefined;
    module.exports = factory(exports, require("..").Query, require("..").Parser.RestConditionParser);
    define = undefined;
});

define(["exports", "Query", "RestConditionParser"], function (exports, Query, parser) {

    var comparatorMap = {
        "eql": "=",
        "gt": ">",
        "lt": "<",
        "lte": "<=",
        "gte": ">="
    }, undefined;

    var QueryParser = {

        /***
         *
         * @param {Object} params query hash
         * @return {Query}
         */
        parse: function (params, q) {
            q = q || new Query();

            if (params.sort) {
                this._parseSort(params.sort, q);
            }

            if (params.where) {
                this._parseCondition(params.where, q);
            }

            var undefined;
            if (params.limit !== undefined) {
                var limit = parseInt(params.limit, 10);
                if (!isNaN(limit)) {
                    q.limit(limit);
                }

            }

            if (params.offset !== undefined) {
                var offset = parseInt(params.offset, 10);
                if (!isNaN(offset)) {
                    q.offset(offset);
                }
            }

            return q;
        },

        _parseSort: function (sortStatement, q) {
            var sortStatements = sortStatement.split(",");

            if (sortStatements.length) {
                q.sort.apply(q, sortStatements);
            }
        },

        _parseCondition: function (condition, query) {
            var tree = parser.parse(condition);

            return this._parseTree(tree, query);
        },

        _parseTree: function (tree, q) {
            var name = tree.name,
                args = tree.args;

            // || name === "or"
            if (name === "and" || name === "or" || name === "not") {
                q = q || new Query();
                var w = q.where(name),
                    arg;
                for (var i = 0; i < args.length; i++) {
                    arg = args[i];
                    if (arg.name && arg.args) {
                        var expression = this._parseTree(arg);
                        if (expression) {
                            w.push(expression);
                        } else {
                            w[arg.name].apply(w, this._convertArguments(arg.args));
                        }
                    }
                }
                return w;
            }
        },

        _convertArguments: function (args) {
            for (var i = 1; i < args.length; i++) {
                args[i] = this._stringToPrimitive(args[i]);
            }
            return args;
        },

        _stringToPrimitive: function (str) {
            var type = null;
            // check for array
            if (str instanceof Array) {
                for (var i = 0; i < str.length; i++) {
                    str[i] = this._stringToPrimitive(str[i]);
                }
                return str;
            }
            // check for object
            if (typeof(str) == "object") {
                type = str.type;
                str = str.value;
            }

            // if it's a string
            if (typeof(str) === "string") {
                var parts = str.split(":");
                if (parts.length > 1) {
                    type = parts[0];
                    str = parts[1];
                }
                if (type === "string") {
                    return "" + str;
                }
                var num = Number(str);
                if (!isNaN(num)) {
                    return num;
                }

                if (str === "true") {
                    return true;
                } else if (str === "false") {
                    return false;
                }

                if (str === "null") {
                    return null;
                }
            }
            return str;
        }

    };

    exports.RestQueryParser = QueryParser;

    return exports;
});