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

    Query.prototype = {

        limit: function (limit) {
            this.query.limit = limit;
            return this;
        },

        sort: function (sort) {
            this.query.sort = sort;
            return this;
        },

        offset: function (offset) {
            this.query.offset = offset;
            return this;
        },

        toObject: function () {
            return this.query;
        },

        where: function (type) {
            this.query.where = this.query.where || new Where(type);
            return this.query.where;
        }

    };

    var comparatorMethods = ["eql", "like", "lt", "lte", "gt", "gte", "in"],
        nestedWhereMethods = ["not", "and", "or"];

    var Where = function (type) {
        this.operator = type || "and";
        this.expressions = [];
    };

    var Comparator = function (operator, field, value) {
        this.operator = operator;
        this.field = field;
        this.value = value;
    };

    Where.prototype.push = function(expression){
        this.expressions.push(expression);
    };

    Comparator.prototype = {
        getValue: function () {
            return this.value[0];
        }
    };

    for (var i = 0; i < comparatorMethods.length; i++) {
        (function (operator) {
            Where.prototype[operator] = function (field, value) {

                if (field instanceof Object) {
                    // do it for all key values pairs
                    for (var key in field) {
                        if (field.hasOwnProperty(key)) {
                            this[operator](key, field[key]);
                        }
                    }
                } else {
                    this.expressions.push(new Comparator(operator, field, value));
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
        (function(type) {

            Where.prototype[type] = function() {

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

            Query.prototype[type] = function() {
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

    exports.query = query;
    exports.Query = Query;

}(typeof(exports) === "undefined" ? this : exports));