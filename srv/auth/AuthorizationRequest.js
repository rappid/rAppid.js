define(["js/core/Base", "underscore"], function(Base, _) {

    return Base.inherit('srv.auth.AuthorizationRequest', {

        ctor: function(resource) {
            this.$authorized = false;

            this.$ = _.defaults(resource, {
                type: null
            });
        },

        isAuthorized: function() {
            return this.$authorized;
        }

    });

});