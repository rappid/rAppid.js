define(["srv/core/Template"], function (Template) {
    return Template.inherit('srv.core.Route', {

        defaults: {
            regex: null
        }

    });
});