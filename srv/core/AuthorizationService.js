define(['js/core/Component', 'srv/auth/AuthorizationProvider', 'flow', "js/core/Error", "srv/error/AuthorizationError"], function (Component, AuthorisationProvider, flow, Error, AuthorizationError) {

    return Component.inherit('srv.core.AuthorizationService', {

        ctor: function () {
            this.$providers = [];
            this.callBase();
        },

        addChild: function (child) {
            if (child instanceof AuthorisationProvider) {
                this.$providers.push(child);
            } else {
                throw new Error("Child for Authorization Service must be an AuthorizationProvider");
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

        },

        isAuthorized: function (context, authorizationRequest, callback) {

            var providers = this.$providers;

            flow()
                .seqEach(providers, function (provider, cb) {

                    if (provider.isResponsibleForAuthorizationRequest(context, authorizationRequest)) {

                        provider.isAuthorized(context, authorizationRequest, function (err) {
                            if (!err) {
                                authorizationRequest.$authorized = true;
                                cb.end();
                            } else {
                                cb(err);
                            }
                        });
                    } else {
                        cb();
                    }
                })
                .seq(function() {
                    if (providers.length !== 0 && !authorizationRequest.isAuthorized()) {
                        // default rule: deny
                        throw new AuthorizationError();
                    }
                })
                .exec(function (err) {
                    callback(err);
                });
        }
    });
});