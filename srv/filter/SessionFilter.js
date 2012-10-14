define(['srv/core/Filter'], function(Filter){

    return Filter.inherit('srv.filter.SessionFilter', {

        defaults: {
            sessionName: "sessionId",
            sessionId: null
        },

        beginRequest: function (context, callback) {
            var sessionName = this.$.sessionName,
                sessionId = context.request.cookies[sessionName];


            sessionId = sessionId || this.generateSessionId();
            // TODO: read session data from data source

//            context.response.setHeader(this.$.sessionName)

            callback();
        },

        generateSessionId: function() {
            (function (uuidRegEx, uuidReplacer) {
                return function () {
                    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
                };
            })(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == "x" ? r : (r & 3 | 8);
                return v.toString(16);
            })
        },

        beforeHeadersSend: function (context, callback) {
            callback();
        },

        endRequest: function (context, callback) {
            console.log("endRequest");
            callback();
        }
    })
});