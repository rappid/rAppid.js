define(['js/data/Model'], function (Model) {
    return Model.inherit('srv.core.ServerSession', {

        schema: {
            expires: Date,
            data: {
                type: Object,
                required: false
            }
        },

        defaults: {
            data: Object
        },

        idField: "sessionId",

        start: function (callback) {
            var self = this;

            if (this.$started) {
                internalCallBack();
            } else {
                if (this.$.sessionId) {
                    this.sessionId = this.$.sessionId;
                    // fetch session with session id
                    this.fetch(null, function (err) {
                        if (err) {
                            self.log("Couldn't fetch session.", "warn");
                        } else if (self.$.expires.getTime() < (new Date()).getTime()) {
                            // if session is expired
                            // clear session data
                            self.clear();
                        }

                        internalCallBack();
                    });
                } else {
                    this.sessionId = this.$sessionFilter && this.$sessionFilter.generateSessionId();
                    internalCallBack();
                }
            }

            function internalCallBack(err) {
                self.$started = true;
                callback(err);
            }
        },
        /***
         *
         * @param {String} key
         * @param data
         */
        setItem: function(key, data){
            this.$.data[key] = data;
        },

        /**
         *
         * @param {String} key
         * @return {*|Object|*|*}
         */
        getItem: function(key){
            return this.$.data[key];
        },

        /**
         * clears all items
         */
        clearItems: function(){
            this.set('data', {});
        }
    });
});