/*!
 * flow.js JavaScript Library v0.2.5
 * https://github.com/it-ony/flow.js
 *
 * Copyright 2012, Tony Findeisen
 * Licensed under the MIT license.
 * https://raw.github.com/it-ony/flow.js/master/LICENSE
 *
 * Date: Mon Mar 12 2012 12:36:34 GMT+0100 (CET)
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
        this.type = type || "and";
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