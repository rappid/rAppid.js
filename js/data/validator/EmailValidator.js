define(['js/data/validator/RegExValidator'], function (RegExValidator) {

    return RegExValidator.inherit('js.data.validator.EmailValidator', {
        defaults: {
            regEx: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            errorCode: 'emailError'
        }
    });
});