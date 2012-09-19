define(['js/core/Component', 'js/core/Base'], function (Component, Base, undefined) {

    return Component.inherit('js.data.validator.Validator', {

        /***
         * validates data
         * @param data
         * @param callback
         */
        validate: function (data, callback) {

            var self = this,
                callbackInvoked = false;

            try {
                var result = this._validate(data);

                if (result === true) {
                    // no error
                    internalCallback(null);
                } else {
                    // validation failed
                    if (!result) {
                        // we got an error, which could be detected with if(err) so we use true instead
                        result = true;
                    }

                    internalCallback(result);
                }
            } catch (e) {
                internalCallback(e);
            }

            function internalCallback(err) {
                if (callbackInvoked) {
                    self.log('Validator returned twice. Ignore second return', Base.LOGLEVEL.WARN);
                    return;
                }

                callbackInvoked = true;
                callback(err);
            }
        },

        /***
         * performs a synchronous validation
         * @param data
         * @abstract
         * @private
         */
        _validate: function (data) {
            return "abstract method _validate from Validator";
        }
    })
})
;