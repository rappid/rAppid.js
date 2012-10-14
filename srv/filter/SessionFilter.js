define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession'], function(Filter, require, flow, DataSource, ServerSession){


    return Filter.inherit('srv.filter.SessionFilter', {

        // TODO: add default dataSource
        $dataSource: null,

        $activeSessions: 0,

        defaults: {
            sessionClassName: 'srv.core.ServerSession',

            sessionName: "sessionId",

            sessionId: null,

            timeout: 120 // in minutes
        },

        start: function (server, callback) {
            var self = this;

            require([this.$.sessionClassName.replace(/\./g, '/')], function(sessionFactory) {

                if (sessionFactory.classof(ServerSession)) {
                    self.$sessionFactory = sessionFactory;
                    callback();
                } else {
                    callback("SessionClassName isn't a ServerSession")
                }

            }, function(err) {
                callback(err);
            })
        },

        _setSessionCookie: function(context, session){
            // set session id in cookie
            context.response.cookies.set(this.$.sessionName, session.$.id, {expires: session.$.expires});
        },

        _getExpiresDate: function(){
            var date = new Date();
            date.setTime(date.getTime() + this.$.timeout * 1000);
            return date;
        },

        _saveNewSession: function(context, session, callback){
            session.save(null, function (err) {
                if (!err) {
                    self.$activeSessions++;
                }
                callback(err);
            });
        },

        beginRequest: function (context, callback) {
            var sessionName = this.$.sessionName,
                sessionId = context.request.cookies[sessionName];

            var self = this;

            flow()
                .seq(function(cb){
                    // TODO: find a better way to clear the cache
                    self.$dataSource.getContext().clear();
                    // create a session instance
                    context.session = self.$dataSource.createEntity(self.$sessionFactory, sessionId);
                    var serverSession = context.session;

                    // if session is new -> save
                    if (serverSession.isNew()) {
                        // FIXME
                        // TODO: why to save session here -> not necessary and
                       self._saveNewSession(context, serverSession, cb);
                    } else {
                        // else fetch session data
                        serverSession.fetch(null, function(err){
                            // if err or not found
                            if(err){
                                // set session as new
                                serverSession.set('id', undefined);
                                // save the session
                                self._saveNewSession(context, serverSession, cb);
                            } else {
                                self._setSessionCookie(context, serverSession);
                                cb();
                            }
                        });
                    }
                })
                .exec(callback);
        },

        addChild: function(child){
            if(child instanceof DataSource){
                this.$dataSource = child;
            }
            this.callBase();
        },

        endRequest: function (context, callback) {

            // on end, save the session yeah!
            if (context.session) {
                context.session.set('expires', this._getExpiresDate());
                this._setSessionCookie(context, context.session);
                context.session.save(null, function() {
                    // TODO: do we need to destory the session here, why ?
                    context.session.destroy();
                    callback();
                });
            } else {
                callback();
            }

        }
    })
});