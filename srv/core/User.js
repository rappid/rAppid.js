define(["js/core/Bindable","js/core/List", "flow", "srv/core/AuthorizationRequest"], function(Bindable, List, flow, AuthorziationRequest){

    return Bindable.inherit('srv.core.User',{

        defaults: {
            authentications: List
        },

        ctor: function (context, server) {
            this.$context = context;
            this.$server = server;

            this.callBase();
        },

        addAuthentication: function(authentication){
            this.$.authentications.add(authentication);
        },

        getAuthenticationByProviderName: function(providerName){
            var ret = null;
            this.$.authentiactions.each(function(auth){
                if(auth.$.provider === providerName){
                    ret = auth;
                    this["break"]();
                }
            });

            return ret;
        },

        isAnonymous: function(){
            return this.$.authentications.isEmpty();
        },

        addAuthorisationRequest: function (data, filter) {
            this.$authenticationRequests.push(new Identity.AuthenticationRequest(data, filter));
        },

        loadAuthentications: function (callback) {

            var self = this;
            this._initAuthentications(function (err) {
                callback(err, self.authentications);
            });

        },

//        _initAuthentications: function (callback) {
//            if (!this.authentications) {
//                var self = this;
//                this.authentications = [];
//                flow()
//                    .parEach(this.$authenticationRequests, function (authRequest, cb) {
//                        // if the filter has it's own auth provider
//                        if (authRequest.filter.$.authenticationProvider) {
//                            authRequest.filter.$.authenticationProvider.authenticate(authRequest.data, function (err, authentication) {
//                                if (!err && authentication) {
//                                    self.authentications.push(authentication);
//                                }
//                                cb(err);
//                            });
//                        } else {
//                            self.$server.$authenticationProviders.authenticate(authRequest.data, function (err, authentications) {
//                                if (!err && authentications) {
//                                    self.authentications = self.authentications.concat(authentications);
//                                }
//                                cb(err);
//                            });
//
//                        }
//
//                    })
//                    .exec(callback);
//            } else {
//                callback();
//            }
//        },

        _initAuthentications: function(callback) {

            flow()
                .parEach(this.$.authentications.$items, function(authentication, cb) {
                    authentication.init(cb)
                })
                .exec(callback)
        },

        isAuthorized: function (authorizationRequest, callback) {
            var self = this;

            if (!(authorizationRequest instanceof AuthorziationRequest)) {
                authorizationRequest = new AuthorziationRequest(authorizationRequest);
            }

            this._initAuthentications(function (err) {
                if (!err) {
                    self.$server.$authorisationService.isAuthorized(authorizationRequest, callback);
                } else {
                    callback(err);
                }
            });

        }

    });

});