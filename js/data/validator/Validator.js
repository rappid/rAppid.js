define(['js/core/Bindable'], function (Bindable) {

    var defaultConditionFnc = function(){
        return true;
    };

    var Validator = Bindable.inherit('js.data.validator.Validator', {

        $validatorCache: {},

        defaults: {
            field: null,
            errorCode: 'isInvalid',
            errorMessage: null,
            condition: null
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
                callbackInvoked = false,
                condition = this.$.condition || defaultConditionFnc;

            try {
                internalCallback(null, condition(entity) ? this._validate(entity) : null);
            } catch(e) {
                if (e instanceof Validator.Error) {
                    internalCallback(null, e);
                } else {
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
            if (this.$.field) {
                return  (this.$.errorMessage || "Field '%' is invalid").replace('%', this.$.field);
            } else {
                return this.$.errorMessage || "Entity is invalid";
            }
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