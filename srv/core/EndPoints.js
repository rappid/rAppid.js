define(['js/core/Component', 'srv/core/EndPoint', 'flow'], function (Component, EndPoint, flow) {
    return Component.inherit('srv.core.EndPoints', {

        ctor: function() {
            this.$endPoints = [];
            this.callBase();
        },

        addChild: function(child) {
            if (child instanceof EndPoint) {
                this.$endPoints.push(child);
            } else {
                throw new Error("Child for EndPoints must be an EndPoint");
            }
        },

        start: function(server, callback) {
            if (!this.$endPoints.length) {
                callback(new Error("No endPoint specified"));
                return;
            }

            flow()
                .seqEach(this.$endPoints, function(endPoint, cb) {
                    endPoint.start(server, cb);
                })
                .exec(callback);
        },

        shutdown: function(callback) {
            flow()
                .seqEach(this.$endPoints, function (endPoint, cb) {
                    endPoint.stop(function(){
                        // ignore errors during shutdown
                        cb();
                    });
                })
                .exec(callback);
        }

    })
});