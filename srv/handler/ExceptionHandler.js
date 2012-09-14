define(['srv/core/Handler'], function(Handler) {

    return Handler.inherit('srv.core.ExceptionHandler', {
        isResponsibleForRequest: function() {
            return false;
        }
    });
});