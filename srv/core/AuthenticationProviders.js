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
                    throw new Error("Child for Providers must be an AuthenticationProvider");
                }

                this.callBase();
            },

            stop: function (callback) {
                flow()
                    .seqEach(this.$providers, function (provider, cb) {
                        // ignore errors during stop
                        provider.stop(function () {
                            cb();
                        });
                    })
                    .exec(callback);
            },

            start: function (server, callback) {

                flow()
                    .seqEach(this.$providers, function (provider, cb) {
                        provider.start(server, cb);
                    })
                    .exec(callback);

            }

        });
    });