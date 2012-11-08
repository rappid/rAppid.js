define(['srv/core/EndPoint', 'http'], function(EndPoint, Http) {

    return EndPoint.inherit('srv.endpoint.HttpEndPoint', {

        defaults: {
            port: 80,
            hostname: null,
            backlog: null
        },

        _start: function(callback) {
            this.$connections = [];
            var self = this;
            this.$endPoint = Http.createServer(function(req, res) {
                self.handleRequest(req, res);
            });

            this.$endPoint.on('listening', function() {
                self.log("HttpEndPoint started at :" + self.$.port);
                callback();
            });

            this.$endPoint.on('error', callback);
            this.$endPoint.on('connection', function(connection){
                self.$connections.push(connection);
                connection.on('close', function(){
                    var index = self.$connections.indexOf(connection);
                    if(index > -1){
                        self.$connections.splice(index,1);
                    }
                })
            });
            this.$endPoint.listen(this.$.port, this.$.hostname, this.$.backlog);

        },

        _stop: function(callback) {
            this.log("HttpEndPoint at :" + this.$.port + " stopped");
            this.$endPoint.on('close', function() {
                callback();
            });

            this.$connections.forEach(function(connection){
                connection.destroy();
            });

            this.$endPoint && this.$endPoint.close();
        },

        uri: function() {
            return "http://" + (this.$.hostname || "localhost") + ":" + this.$.port;
        },

        protocol: "http"
    });
});