define(['js/data/validator/Validator', 'underscore'], function (Validator, _) {

    return Validator.inherit('js.data.validator.EnumValidator', {
        defaults: {
            errorCode: 'enumError',
            enumeration: null
        },

        ctor: function(){
            var b = this.callBase();

            if(!this.$.enumeration){
                throw new Error("No enumeration defined!");
            }

            if(!(this.$.enumeration instanceof Array)){
                throw new Error("Enumeration must be an array");
            }

            return b;
        },

        _generateCacheKey: function(){
            return null;
        },

        _validate: function (entity) {
            var value = entity.$[this.$.field],
                schemaDefinition = entity.schema[this.$.field],
                required = schemaDefinition ? schemaDefinition.required : true;

            if(_.isString(value) && (required && value.length || !required)){
                if(!_.include(this.$.enumeration, value)){
                    return this._createFieldError();
                }
            }
        }

    });
});