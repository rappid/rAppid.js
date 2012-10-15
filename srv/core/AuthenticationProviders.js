define(['js/core/Component', 'srv/core/AuthenticationProvider', 'flow'],
    function (Component, AuthenticationProvider, flow) {

        return Component.inherit('srv.core.AuthenticationProviders', {

            ctor: function () {
                this.$providers = [];
                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof AuthenticationProvider) {
                    this.$providers.push(child);
                } else {
                    throw new Error("Child for Filters must be an Filter");
                }

                this.callBase();
            },

            stop: function (callback) {
                flow()
                    .seqEach(this.$providers, function (filter, cb) {
                        // ignore errors during stop
                        filter.stop(function () {
                            cb();
                        });
                    })
                    .exec(callback);
            },

            start: function (server, callback) {

                flow()
                    .seqEach(this.$providers, function (filter, cb) {
                        filter.start(server, cb);
                    })
                    .exec(callback);

            },

            authenticate: function(authenticationData, callback) {
                var authentications = [];
                flow()
                    .seqEach(this.$providers, function (provider, cb) {
                        provider.authenticate(authenticationData, function(err, authentication){
                            if(!err && authentication){
                                authentications.push(authentication);
                            }
                        });
                    })
                    .exec(function(err){
                        callback(err, authentications);
                    });
            }
        })
    });