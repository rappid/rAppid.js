define(['js/data/Model'], function (Model) {
    return Model.inherit('srv.core.ServerSession', {
        schema: {
            id: String,
            expires: Date
        },

        start: function (callback) {
            var self = this;


            if (this.$.id) {
                this.sessionId = this.$.id;
                // fetch session with session id
                this.fetch(null, function (err) {
                    if (err) {
                        // if session couldn't be fetched
                        self.log("Couldn't fetch session.", "warn");
                        // set session as new
                        self.set('id', undefined);
                    }else if(self.$.expires.getTime() < (new Date()).getTime()){
                        // if session is expired
                        // clear session data
                        self.clear();
                        // and set old session id
                        self.set('id',self.sessionId);
                    }

                    internalCallBack();
                });
            } else {
                this.sessionId = this.$sessionFilter && this.$sessionFilter.generateSessionId();
                internalCallBack();
            }

            function internalCallBack(err){
                self.$started = true;
                callback(err);
            }
        }
    });
});