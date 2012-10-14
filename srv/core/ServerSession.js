define(['js/data/Model'], function(Model) {
    return Model.inherit('srv.core.ServerSession', {
         schema: {
             expires: Date
         },

        start: function(callback) {
            var self = this;

            if (this.$.id) {
                // session with session id
                this.fetch(null, function (err) {
                    if (err) {
                        self.log("Couldn't fetch session.", "warn");
                    }
                    self.$started = true;
                    callback();
                });
            } else {
                this.$started = true;
                this.set("id", this.$sessionFilter.generateSessionId());
                callback();
            }
        }
    });
});