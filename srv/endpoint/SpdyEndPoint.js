define(['srv/core/EndPoint', 'spdy', 'fs'], function(EndPoint, Spdy, Fs) {

    return EndPoint.inherit('srv.endpoint.SpdyEndPoint', {

        defaults: {
            port: 80,
            hostname: null,
            backlog: null,

            key: null,
            cert: null,
            ca: null
        },

        _start: function(callback) {

            var options;

            if (this.$.key && this.$.cert && this.$.ca) {
                options = {};

                try {
                    options.key = Fs.readFileSync(this.$.key);
                    options.cert = Fs.readFileSync(this.$.cert);
                    options.ca = Fs.readFileSync(this.$.ca);
                } catch (e) {
                    callback(e);
                    return;
                }
            } else {
                callback(new Error("Key, cert or ca missing"));
                return;
            }

            this.$connections = [];
            var self = this;
            this.$endPoint = Spdy.createServer(options, function(req, res) {
                self.handleRequest(req, res);
            });

            this.$endPoint.on('listening', function() {
                self.log("SpdyEndPoint started at :" + self.$.port);
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
                });
            });

            this.$endPoint.listen(this.$.port, this.$.hostname);
        },

        _stop: function(callback) {
            this.log("SpdyEndPoint at :" + this.$.port + " stopped");
            this.$endPoint.on('close', function() {
                callback();
            });

            this.$connections.forEach(function(connection){
                connection.destroy();
            });

            this.$endPoint && this.$endPoint.close();
        },

        uri: function() {
            return "https://" + (this.$.hostname || "localhost") + ":" + this.$.port;
        },

        protocol: "https"
    });
});