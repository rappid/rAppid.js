define(['js/data/Model', 'flow'], function (Model, flow) {

    return Model.inherit('srv.core.Identity', {

        defaults: {
            /**
             * The authentication object of this identity
             */
            authentication: null
        },

        schema: {
            /**
             * The internal user id
             */
            userId: String,
            /**
             * The name of the provider
             */
            provider: String,
            /***
             * The provider user id
             */
            providerUserId: String
        }

    });
});