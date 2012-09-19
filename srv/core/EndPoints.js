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

            for (var i = 0; i < this.$endPoints.length; i++) {
                var endPoint = this.$endPoints[i];
                try {
                    endPoint.start(server);
                } catch (e) {
                    // start fault for end point -> shut down the server
                    this.shutdown(function () {
                        var error = new Error("Couldn't start all end points. shut down started end points");
                        error.nestedError = e;

                        callback(error)
                    });
                    return;
                }
            }

            // all end points started successfully
            callback();
        },

        shutdown: function(callback) {
            flow()
                .parEach(this.$endPoints, function (endPoint, cb) {
                    endPoint.stop(function(){
                        // ignore errors during shutdown
                        cb();
                    });
                })
                .exec(callback);
        }

    })
});