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

        where: function () {
            this.query.where = this.query.where || new Where();
            return this.query.where;
        }

    };

    var comparatorMethods = ["eql", "like", "lt", "lte", "gt", "gte", "in"],
        nestedWhereMethods = ["not", "and", "or"];

    var Where = function (type) {
        this.operator = type || "and";
        this.expressions = [];
    };

    var Comparator = function (operator, field, values) {
        this.operator = operator;
        this.field = field;
        this.values = values;
    };

    Comparator.prototype = {
        getValue: function () {
            return this.values[0];
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
                    var values = Array.prototype.slice.call(arguments);
                    values.shift();
                    this.expressions.push(new Comparator(operator, field, values));
                }


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

            Where.prototype[type] = function(nestedFunction) {
                var where = new Where(type);
                nestedFunction.call(where, where);

                this.expressions.push(where);
            };

            Query.prototype[operator]

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