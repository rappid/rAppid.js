define(['js/core/Bindable'], function (Bindable) {
    var Validator = Bindable.inherit('js.data.validator.Validator', {

        $validatorCache: {},

        defaults: {
            field: null,
            errorCode: 'isInvalid',
            errorMessage: null
        },

        ctor: function () {
            this.callBase();

            var cacheKey = this._generateCacheKey.apply(this, arguments);
            if (cacheKey && !this.$validatorCache[cacheKey]) {
                this.$validatorCache[cacheKey] = this;
            }

            return this.$validatorCache[cacheKey];
        },

        _generateCacheKey: function () {
            return null;
        },

        /***
         * validates entities
         * @param entity
         * @param callback
         */
        validate: function (entity, callback) {

            var self = this,
                callbackInvoked = false;

            try {
                internalCallback(null, this._validate(entity));
            } catch(e) {
                if (e instanceof Validator.Error) {
                    internalCallback(null, e);
                } else{
                    internalCallback(e);
                }
            }

            function internalCallback(err, result) {
                if (callbackInvoked) {
                    self.log('Validator returned twice. Ignore second return', Base.LOGLEVEL.WARN);
                    return;
                }

                callbackInvoked = true;
                callback(err, result);
            }
        },

        /***
         * performs a synchronous validation
         * @param {js.data.Entity} entity
         * @abstract
         * @private
         */
        _validate: function (entity) {
            return "abstract method _validate from Validator";
        },

        _getErrorMessage: function () {
            if(!this.$.errorMessage){
                if(this.$.field){
                    return "Field '%' is invalid".replace('%', this.$.field);
                }else{
                    return "Entity is invalid";
                }
            }
            return this.$.errorMessage;
        },
        _createFieldError: function () {
            return new Validator.Error({
                code: this.$.errorCode,
                message: this._getErrorMessage(),
                field: this.$.field
            })
        }

    });

    Validator.Error = Bindable.inherit({

    });

    return Validator;
})
;