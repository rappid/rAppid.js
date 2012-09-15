define(['js/core/Base'], function(Base) {
    return Base.inherit('srv.handler.rest.Resource', {

        ctor: function(configuration, parentResource) {
            this.$resourceConfiguration = configuration;
            this.$parentResource = parentResource;

            this.callBase();
        },

        handleRequest: function(context) {

            var method = context.request.method;

        }

    });
});