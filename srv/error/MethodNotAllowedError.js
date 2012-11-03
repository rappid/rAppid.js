define(['srv/core/HttpError'], function(HttpError) {
    return HttpError.inherit('srv.error.MethodNotAllowedError', {
        ctor: function (message, allowedMethods, statusText) {
            this.allowedMethods = allowedMethods || [];
            this.callBase(message, 405, statusText)
        },

        _beforeSend: function(context) {
            context.response.setHeader('Allow', this.allowedMethods.join(", "));
        }
    });
});