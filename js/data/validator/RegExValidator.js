define(['js/data/validator/Validator', 'underscore'], function (Validator, _) {

    return Validator.inherit('js.data.validator.RegExValidator', {
        defaults: {
            errorCode: 'regExError',
            regEx: null,
            inverse: false,
            replaceRegEx: null,
            replaceValue: ""
        },

        ctor: function () {
            var b = this.callBase();

            if (!this.$.regEx) {
                throw new Error("No regular expression defined!");
            }

            return b;
        },

        _generateCacheKey: function (field, regEx) {
            return null;
        },

        _validate: function (entity, options) {
            var value = entity.getTransformedValue(this.$.field),
                schemaDefinition = entity.schema[this.$.field],
                required = schemaDefinition ? schemaDefinition.required : true;

            if (_.isString(value) && (required && value.length || !required)) {

                var replaceRegEx = this.$.replaceRegEx;
                if (replaceRegEx) {
                    value = value.replace(replaceRegEx, this.$.replaceValue);
                }

                var ok = this.$.regEx.test(value);

                if (this.$.inverse) {
                    ok = !ok;
                }

                if (!ok) {
                    return this._createFieldError();
                }
            }
        }

    });
});