define([], function () {

    /***
     * @inherit Error
     */
    return Error.inherit('js.core.Error', {
        ctor: function (message, statusCode, baseError) {
            Error.prototype.constructor.call(this, message, statusCode);

            this.message = message;
            this.statusCode = statusCode;
            this.baseError = baseError;
        }
    });
});