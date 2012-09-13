define(['js/core/Base'], function (Base) {
    return Base.inherit('srv.core.Context', {

        ctor: function(request, response) {
            this.request = request;
            this.response = response;
        }

    })
});