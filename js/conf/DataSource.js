define(["js/conf/Resource"], function (Resource) {

    return Resource.inherit('js.conf.DataSource', {
        _validateConfiguration: function() {
            // no validation needed
        }
    });
});