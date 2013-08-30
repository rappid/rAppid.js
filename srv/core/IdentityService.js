define(["js/core/Component", "js/data/Collection", "srv/core/Identity", "js/data/Query", "js/data/DataSource"], function (Component, Collection, Identity, Query, DataSource) {

    return Component.inherit('srv.core.IdentityService', {

        defaults: {
            dataSource: null
        },

        addChild: function (child) {

            if (child instanceof DataSource) {
                this.set('dataSource', child);
            }

            this.callBase();
        },

        /**
         *
         * Returns an identity by authentication
         *
         * @param authentication
         * @param cb
         */
        fetchIdentityForAuthentication: function (authentication, cb) {
            var query = new Query()
                .eql("providerUserId", authentication.$.providerUserId)
                .eql("provider", authentication.$.provider);

            this.$.dataSource.createCollection(Collection.of(Identity)).query(query).fetch(null, function (err, identities) {
                if (!err) {
                    if (identities.isEmpty()) {
                        cb("no identity found")
                    } else {
                        cb(null, identities.at(0));
                    }
                } else {
                    cb(err);
                }
            });
        },

        /***
         * Creates an identity for a userId and authentication
         * @param {String} userId
         * @param {srv.core.Authentication} authentication
         * @param cb  - callback returns error and identity
         */
        createAndSaveIdentity: function (userId, providerName, providerUserId, cb) {

            var identity = this.$.dataSource.createEntity(Identity);

            identity.set({
                userId: userId,
                provider: providerName,
                providerUserId: providerUserId
            });

            identity.save(null, cb);
        }

    })

});