define(['js/core/Component', 'srv/core/Filter', 'flow'],
    function (Component, Filter, flow) {

        return Component.inherit('srv.core.Filters', {

            ctor: function () {
                this.$filters = [];
                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof Filter) {
                    this.$filters.push(child);
                } else {
                    throw new Error("Child for Filters must be an Filter");
                }

                this.callBase();
            },

            stop: function (callback) {
                flow()
                    .seqEach(this.$filters, function (filter, cb) {
                        // ignore errors during stop
                        filter.stop(function () {
                            cb();
                        });
                    })
                    .exec(callback);
            },

            start: function (server, callback) {

                flow()
                    .seqEach(this.$filters, function (filter, cb) {
                        filter.start(server, cb);
                    })
                    .exec(callback);

            },

            beginRequest: function (context, callback) {
                this._execute("beginRequest", context, callback);
            },

            endRequest: function (context, callback) {
                this._execute("endRequest", context, callback);
            },

            _execute: function(method, context, callback) {
                flow()
                    .seqEach(this.$filters, function (filter, cb) {
                        filter[method](context, cb);
                    })
                    .exec(callback);
            }
        })
    });