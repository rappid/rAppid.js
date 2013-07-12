define(["js/core/Base", "underscore"], function(Base, _) {

    return Base.inherit('srv.core.AuthorisationRequest', {

        ctor: function(resource) {

            this.$resource = _.defaults({
                type: null,
                path: null
            });
        }

    });

});