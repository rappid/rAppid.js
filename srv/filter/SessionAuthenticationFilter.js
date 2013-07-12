define(['srv/core/AuthenticationFilter','flow'], function(AuthenticationFilter, flow) {

    return AuthenticationFilter.inherit('srv.filter.SessionAuthenticationFilter', {

        defaults: {
            /**
             * The key under which the authentication token is saved
             */
            sessionKey: "authenticationToken"
        },

        beginRequest: function (context, callback) {
            var tokens;
            if(context.session){
                tokens = context.session.getItem(this.$.sessionKey);
            }

            if(tokens){
                var self = this;

                flow()
                    .parEach(tokens, function(token, callback){
                        self.authenticateRequestByToken(token, context, callback);
                    })
                    .exec(callback);
            } else {
                callback();
            }
        },

        beforeHeadersSend: function (context, callback) {
            if(this._isResponsibleForRequest(context)){
                var authTokens = [],
                    identity;
                for(var i = 0; i < context.identities.length; i++){
                    identity = context.identities[i];
                    if(identity && identity.$.authentication){
                        authTokens.push(identity.$.authentication.$.token);
                    }
                }
                context.session.setItem(this.$.sessionKey,context.$.authentication.$.token);
            }
            callback();
        },

        _isResponsibleForRequest: function(context){
            return !!context.identities.length;
        }

    });
});