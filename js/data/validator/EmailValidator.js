define(['js/data/validator/RegExValidator'], function (RegExValidator) {

    return RegExValidator.inherit('js.data.validator.EmailValidator', {
        defaults: {
            // TODO: add umlauts
            regEx: /^([a-zA-Z0-9_\.\-])+@(([a-zA-Z0-9\-.])+\.)+([a-zA-Z0-9]{2,6})$/,
            errorCode: 'emailError'
        }
    });
});