define(["js/conf/ResourceConfiguration"], function (Resource) {

    return Resource.inherit('js.conf.DataSourceConfiguration', {
        _validateConfiguration: function() {
            // no validation needed
        }
    });
});