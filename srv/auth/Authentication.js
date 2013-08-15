define(['js/data/Model', 'srv/core/IdentityService'], function(Model, IdentityService) {

    /***
     *
     * Authentication saves information about the authentication
     *
     */
    return Model.inherit('srv.auth.Authentication', {

        schema: {
            /**
             *  A generated token for authentication
             */
            token: String,
            /**
             *  UserID provided by the provider
             */
            providerUserId: String,
            /**
             *  UserData provided by the provider
             */
            providerUserData: Object,
            /**
             * The name of the provider
             */
            provider: String
        },

        defaults: {
            identity: null
        },

        inject: {
            identityService: IdentityService
        },

        idField: "token",

        init: function(callback) {

            if (this.$.identity) {
                callback && callback();
                return;
            }

            var self = this,
                identityService = this.$.identityService;

            identityService.fetchIdentityForAuthentication(this, function(err, identity) {
                if (!err) {
                    self.set("identity", identity);
                }

                callback(err);
            });
        }

    });
});