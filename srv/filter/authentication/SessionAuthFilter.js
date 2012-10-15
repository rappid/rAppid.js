define(['srv/core/AuthenticationFilter'], function (AuthenticationFilter) {

    return AuthenticationFilter.inherit('srv.filter.SessionAuthFilter', {
        defaults: {
            key: 'userId'
        },

        beginRequest: function (context, callback) {
            var userId = context.session.get(this.$.key);
            if(userId){
                var data = {};
                data[this.$.key] = data;
                this._createAuthenticationRequest(data);
            }
            callback();
        }
    })
});