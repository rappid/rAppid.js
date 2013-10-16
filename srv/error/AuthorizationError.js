define(['srv/core/HttpError'], function (HttpError) {
    return HttpError.inherit('srv.error.AuthorizationError', {

        ctor: function (message, allowedMethods, statusText) {

            this.callBase(message, 403, statusText);
        }
    });
});