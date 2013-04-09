define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession'], function (Filter, require, flow, DataSource, ServerSession) {


    return Filter.inherit('srv.filter.SessionFilter', {

        // TODO: add default dataSource
        $dataSource: null,

        $activeSessions: 0,

        defaults: {
            sessionName: "sessionId",
            sessionId: null,
            timeout: 120 // in minutes
        },

        _start: function (callback) {
            if (this.$dataSource) {
                callback();
            } else {
                callback("No dataSource for SessionFilter defined.");
            }
        },

        addChild: function (child) {
            if (child instanceof DataSource) {
                this.$dataSource = child;
            }
            this.callBase();
        },

        beginRequest: function (context, callback) {
            if(context.request.url === "/favicon.ico"){
                callback && callback();
                return;
            }
            var sessionName = this.$.sessionName,
                sessionId = context.request.cookie[sessionName],
                session;

            session = this.$dataSource.createEntity(ServerSession, sessionId);
            context.session = session;
            session.$sessionFilter = this;

            // start session
            session.start(callback);
        },

        generateSessionId: function () {
            var d = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
        },


        beforeHeadersSend: function (context, callback) {
            var session = context.session,
                sessionName = this.$.sessionName,
                sessionId = session.sessionId;

            if (session && session.$started && context.request.cookie[sessionName] !== sessionId) {
                // store session id in cookie
                context.response.cookies.set(sessionName, sessionId);
            }

            callback();
        },

        endRequest: function (context, callback) {

            // on end, save the session yeah!
            var session = context.session, self = this;

            if(session){
                session.set({
                    'expires': this._getExpiresDate(),
                    'sessionId' : session.sessionId
                });
                session.save(null, function (err) {
                    if(err){
                        self.log("Couldn't save session.", "warn");
                    }
                    callback();
                });
            } else {
                callback && callback();
            }

        },

        _getExpiresDate: function () {
            var date = new Date();
            date.setTime(date.getTime() + this.$.timeout * 1000 * 60 );
            return date;
        }


    });
});