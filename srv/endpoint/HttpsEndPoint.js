define(['srv/core/EndPoint', 'https', 'fs'], function(EndPoint, Https, fs) {

    return EndPoint.inherit('srv.endpoint.HttpsEndPoint', {

        defaults: {
            port: 443,
            keyFile: null,
            certFile: null
        },

        _start: function() {
            var self = this;
            var options = this._getOptions();

            this.$endPoint = Https.createServer(options, function(req, res) {
                self.handleRequest(req, res);
            });

            this.$endPoint.listen(this.$.port);
        },

        _getOptions: function() {
            return {
                key: fs.readFileSync(this.$.keyFile),
                cert: fs.readFileSync(this.$.certFile)
            };
        },

        _stop: function(callback) {
            this.$endPoint && this.$endPoint.close(callback);
        },

        uri: function () {
            return "https://" + this.$.hostname + ":" + this.$.port;
        },

        protocol: "https"
    });
});