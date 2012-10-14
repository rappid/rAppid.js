define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource'], function(Filter, require, flow, DataSource){


    return Filter.inherit('srv.filter.SessionFilter', {

        // TODO: add default dataSource
        $dataSource: null,
        $activeSessions: 0,
        defaults: {
            sessionClassName: 'srv.core.ServerSession',
            sessionName: "sessionId",
            sessionId: null,
            timeout: 2 // in hours
        },

        _setSessionCookie: function(context, session){
            // set session id in cookie
            context.response.cookies.set(this.$.sessionName, session.$.id, {expires: session.$.expires});
        },

        _getExpiresDate: function(){
           return new Date(new Date().getTime() + this.$.timeout * 60 * 60 * 1000);
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
            console.log("begin request");
            var sessionName = this.$.sessionName,
                sessionId = context.request.cookies[sessionName];

            var sessionFactory, self = this;

            flow()
                .seq(function(cb){
                    sessionFactory = require(self.$.sessionClassName.replace(/\./g,'/'));
                    cb();
                })
                .seq(function(cb){
                    // TODO: find a better way to clear the cache
                    self.$dataSource.getContext().clear();
                    // create a session instance
                    context.session = self.$dataSource.createEntity(sessionFactory, sessionId);
                    var serverSession = context.session;

                    // if session is new -> save
                    if (serverSession.isNew()) {
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

        beforeHeadersSend: function (context, callback) {

            // on end, save the session yeah!
            if(context.session){
                context.session.set('expires', this._getExpiresDate());
                this._setSessionCookie(context, context.session);
                context.session.save(null, function (err) {
                    // and destroy the session object
                    context.session.destroy();
                });
            }
            callback();
        },

        endRequest: function (context, callback) {


            console.log("endRequest");
            callback();
        }
    })
});