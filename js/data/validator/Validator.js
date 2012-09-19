define(['js/core/Component', 'js/core/Base'], function (Component, Base, undefined) {

    return Component.inherit('js.data.validator.Validator', {

        /***
         * validates data
         * @param data
         * @param callback
         */
        validate: function (data, callback) {

            var self = this,
                callbackInvoked = false,
                internalCallback = function (err) {
                    if (callbackInvoked) {
                        self.log('Validator returned twice. Ignore second return', Base.LOGLEVEL.WARN);
                        return;
                    }

                    callbackInvoked = true;
                    callback(err);
                };

            try {
                var synchronousResult = this._validate(data, internalCallback);

                if (synchronousResult === true) {
                    // no error
                    internalCallback(null);
                } else if (synchronousResult !== null && synchronousResult !== undefined) {
                    // validation failed
                    if (!synchronousResult) {
                        // we got an error, which could be detected with if(err) so we use true instead
                        synchronousResult = true;
                    }
                    internalCallback(synchronousResult);
                } else {
                    // validation will be invoke callback by itself
                }

            } catch (e) {
                internalCallback(e);
            }
        },

        /***
         *
         * @param data
         * @param callback
         * @private
         */
        _validate: function (data) {
            throw "abstract method _validate from Validator";
        }
    })
});