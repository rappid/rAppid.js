define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession'], function (Filter, require, flow, DataSource, ServerSession) {


    return Filter.inherit('srv.filter.AuthenticationFilter', {

        defaults: {
            loginPath: '' // path to session resource
        },

        _start: function (callback) {
            // TODO: implement some stuff
        },

        beginRequest: function (context, callback) {
            var sessionName = this.$.sessionName,
                session = context.session;

            // go through list of authentication providers

            // provide false or a user

            // set user on context

            callback();

        },


        beforeHeadersSend: function (context, callback) {
            // TODO: implement

            callback();
        },

        endRequest: function (context, callback) {
            // TODO: implement

            callback();
        }
    })
});