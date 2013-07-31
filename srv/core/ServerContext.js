define(['js/core/Base', 'js/core/Bus'], function(Base, Bus) {

    return Base.inherit('srv.core.ServerContext', {

        ctor: function(requireJsContext, applicationContext) {
            this.$requirejsContext = requireJsContext;
            this.$applicationContext = applicationContext;

            this.$bus = new Bus(this);
        }
    });

});