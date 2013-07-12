define(['js/data/Model'], function(Model) {

    /***
     *
     * Authentication saves information about the authentication
     *
     */
    return Model.inherit('srv.core.Authentication', {

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

        idField: "token",

        init: function(identityService, callback) {

            var self = this;

            identityService.fetchIdentityForAuthentication(this, function(err, identity) {
                if (!err) {
                    self.set("identity", identity);
                }

                callback(err);
            });
        }

    });
});