define(['js/data/validator/Validator', 'underscore'], function (Validator, _) {

    return Validator.inherit('js.data.validator.RegExValidator', {
        defaults: {
            errorCode: 'regExError'
        },

        ctor: function(){
            var b = this.callBase();

            if(!this.$.regEx){
                throw new Error("No regular expression defined!");
            }

            return b;
        },

        _generateCacheKey: function(field, regEx){
            return null;
        },

        _validate: function (entity) {
            var value = entity.$[this.$.field];
            if(value && _.isString(value)){
                if(!this.$.regEx.test(value)){
                    return this._createFieldError();
                }
            }
            return true;
        }

    })
})
;