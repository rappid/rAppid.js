define(["js/core/Base", "underscore"], function(Base, _) {

    return Base.inherit('srv.core.AuthorisationRequest', {

        ctor: function(resource) {

            this.$isAuthorized = false;

            this.$resource = _.defaults({
                type: null
            });
        },

        isAuthorized: function() {
            return this.$isAuthorized;
        }

    });

});