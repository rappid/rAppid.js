/*!
 * query.js
 *
 * Copyright 2012 Tony Findeisen, Marcus Krejpowicz
 * Licensed under the MIT license.
 *
 * Date: Sat Jan 05 2013 19:00:34 GMT+0100 (CET)
 */
(function (exports) {
    "use strict";

    var query = function () {
        return new Query();
    };

    var Query = function () {
        this.query = {};
    };

    var sortParser = /^([+-])?(.+)$/;

    Query.prototype = {

        limit: function (limit) {
            this.query.limit = limit;
            return this;
        },

        sort: function (fields) {

            fields = Array.prototype.slice.call(arguments);
            var sort = [];

            function parseFields(fields) {
                for (var i = 0; i < fields.length; i++) {
                    parseAndAddField(fields[i]);
                }
            }

            function parseAndAddField(field) {
                if (field instanceof Array) {
                    parseFields(field);
                } else if (field instanceof Object) {

                    if (!field.hasOwnProperty("field")) {
                        throw new Error("Field in sort direction missing");
                    }

                    field.direction = field.direction || 1;
                    sort.push(field);
                } else {
                    // string
                    var match = sortParser.exec(field);
                    if (!match) {
                        throw new Error("Field cannot be parsed");
                    }

                    sort.push({
                        direction: match[1] === "-" ? -1 : 1,
                        field: match[2]
                    });
                }
            }

            parseFields(fields);

            this.query.sort = sort;
            return this;
        },

        offset: function (offset) {
            this.query.offset = offset;
            return this;
        },

        toObject: function () {
            var ret = {};
            if (this.query.offset) {
                ret.offset = this.query.offset;
            }
            if (this.query.where) {
                ret.where = this.query.where.toObject();
            }
            if (this.query.limit) {
                ret.limit = this.query.limit;
            }
            if (this.query.sort) {
                ret.sort = clone(this.query.sort);
            }
            return ret;
        },

        where: function (type) {
            this.query.where = this.query.where || new Where(type);
            return this.query.where;
        },

        sortCacheId: function () {
            var ret = [];

            if (this.sort) {
                for (var i = 0; i < this.query.sort.length; i++) {
                    var sortItem = this.query.sort[i];
                    ret.push((sortItem.direction === -1 ? "-" : "+") + sortItem.field);
                }
            }

            return ret.join(";");
        },

        whereCacheId: function () {
            if (this.query.where) {
                return this.query.where.operator + ":" + generateExpressionsCache(this.query.where.expressions);
            } else {
                return "";
            }
        },

        cacheId: function () {
            return this.sortCacheId() + ":" + this.whereCacheId();
        },
        /**
         * Tries to find a expression for an operator and a field
         * @param {String} operator
         * @param {String} field
         * @returns {*}
         */
        findExpression: function (operator, field) {
            if (!this.query.where) {
                return null;
            }

            function findExpression(expressions) {
                var expression,
                    ret = null;
                for (var i = 0; i < expressions.length; i++) {
                    expression = expressions[i];
                    if (expression instanceof Where) {
                        ret = findExpression(expression.expressions);
                    } else if (expression instanceof Comparator) {
                        if (expression.operator == operator && expression.field == field) {
                            ret = expression;
                        }
                    }
                    if (ret) {
                        return ret;
                    }

                }
                return ret;
            }

            return findExpression(this.query.where.expressions);
        }

    };

    function generateExpressionsCache(expressions) {
        expressions = expressions || [];
        var expression,
            cacheId = "",
            value;
        for (var i = 0; i < expressions.length; i++) {
            expression = expressions[i];
            if (expression instanceof Where) {
                cacheId += expression.operator + ":" + generateExpressionsCache(expression.expressions);
            } else if (expression instanceof Comparator) {
                value = expression.value;
                if (!(value instanceof Array)) {
                    value = [value];
                }
                var val = "";
                for (var k = 0; k < value.length; k++) {
                    val += value[k] + ":" + typeof(value[k]);
                }
                value = val;

                cacheId += expression.operator + ":" + expression.field + ":" + value + ":";
            }
        }
        return cacheId;
    }

    function clone(obj) {

        if (obj instanceof Array) {
            return obj.slice();
        }

        var ret = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                ret[key] = value instanceof Object ? clone(value) : value;
            }
        }

        return ret;

    }

    var comparatorMethods = ["eql", "like", "lt", "lte", "gt", "gte", "in", "ne"],
        nestedWhereMethods = ["not", "and", "or"];

    var Where = function (type) {
        this.operator = type || "and";
        this.expressions = [];
    };

    var Comparator = function (operator, field, value, type) {
        this.operator = operator;
        this.field = field;
        this.value = value;
        if (type) {
            this.type = type;
        }
    };

    Where.prototype.push = function (expression) {
        this.expressions.push(expression);
    };

    Where.prototype.toObject = function () {

        var expressions = [], expression;
        for (var i = 0; i < this.expressions.length; i++) {
            expression = this.expressions[i];
            if (expression instanceof Where) {
                expressions.push(expression.toObject());
            } else {
                expressions.push(clone(expression));
            }
        }

        return {
            operator: this.operator,
            expressions: expressions
        };

    };

    Comparator.prototype = {
        getValue: function () {
            return this.value;
        }
    };

    for (var i = 0; i < comparatorMethods.length; i++) {
        (function (operator) {
            Where.prototype[operator] = function (field, value, type) {

                if (field instanceof Object) {
                    // do it for all key values pairs
                    for (var key in field) {
                        if (field.hasOwnProperty(key)) {
                            this[operator](key, field[key]);
                        }
                    }
                } else {
                    this.expressions.push(new Comparator(operator, field, value, type));
                }

                return this;

            };

            Query.prototype[operator] = function () {
                var args = Array.prototype.slice.call(arguments);

                var where = this.where();
                where[operator].apply(where, args);

                return this;
            }

        })(comparatorMethods[i]);
    }

    for (var j = 0; j < nestedWhereMethods.length; j++) {
        (function (type) {

            Where.prototype[type] = function () {

                var args = Array.prototype.slice.call(arguments);

                var operationWhere = new Where(type);

                for (var i = 0; i < args.length; i++) {

                    var nestedFunction = args[i];
                    var where;

                    if (nestedFunction instanceof Where) {
                        where = nestedFunction;
                    } else {
                        where = new Where();
                        nestedFunction.call(where, where);
                    }

                    operationWhere.expressions.push(where);
                }

                this.expressions.push(operationWhere);
            };

            Query.prototype[type] = function () {
                var args = Array.prototype.slice.call(arguments);

                var where = this.where();
                where[type].apply(where, args);

                return this;
            }

        })(nestedWhereMethods[j]);
    }

// global on the server, window in the browser
    var previous_query = exports.query;

    query.noConflict = function () {
        exports.query = previous_query;
        return query;
    };

    Query.Where = Where;
    Query.Comparator = Comparator;

    exports.query = query;
    exports.Query = Query;

}(typeof(exports) === "undefined" ? this : exports));