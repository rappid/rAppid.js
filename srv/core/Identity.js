define(['js/core/Base', 'flow'], function (Base, flow) {
    var Identity = Base.inherit('srv.core.Identity', {
        ctor: function (context, server) {
            this.$context = context;
            this.$server = server;
            this.$authenticationRequests = [];

            this.authentications = null;
        },

        addAuthorisationRequest: function(data, filter){
            this.$authenticationRequests.push(new Identity.AuthenticationRequest(data, filter));
        },

        loadAuthentications: function(callback){

            var self = this;
            this._initAuthentications(function(err){
                callback(err, self.authentications)
            });

        },

        _initAuthentications: function(callback){
            if (!this.authentications) {
                var self = this;
                this.authentications = [];
                flow()
                    .parEach(this.$authenticationRequests, function (authRequest, cb) {
                        // if the filter has it's own auth provider
                        if (authRequest.filter.$.authenticationProvider) {
                            authRequest.filter.$.authenticationProvider.authenticate(authRequest.data, function (err, authentication) {
                                if (!err && authentication) {
                                    self.authentications.push(authentication);
                                }
                                cb(err);
                            });
                        } else {
                            self.$server.$authenticationProviders.authenticate(authRequest.data, function (err, authentications) {
                                if (!err && authentications) {
                                    self.authentications = self.authentications.concat(authentications);
                                }
                                cb(err);
                            });

                        }

                    })
                    .exec(callback)
            } else {
                callback();
            }
        },

        isAuthorized: function (authorizationRequest, callback) {
            var self = this;

            this._initAuthentications(doAuthorization);

            function doAuthorization(err) {
                if (!err) {
                    self.$server.$authorisationProviders.isAuthorized(authorizationRequest, callback);
                } else {
                    callback(err);
                }
            }

        }
    });

    Identity.AuthenticationRequest = Base.inherit('srv.core.Identity.AuthenticationRequest',{
        ctor: function(data, filter){
            this.data = data;
            this.filter = filter;
        }
    });

    return Identity;
});