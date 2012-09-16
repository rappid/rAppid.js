define(['require', 'js/core/Base', 'srv/handler/rest/Resource', 'flow'], function (require, Base, Resource, flow) {

    return Base.inherit('srv.handler.rest.ResourceRouter', {

        ctor: function(handler) {
            this.$handler = handler;
        },

        /***
         *
         * @param {srv.core.Context} context
         * @param {Function} callback - function(err, resource)
         *
         */
        getResource: function(context, callback) {

            var path = context.request.urlInfo.pathname,
                handlerRelativePath = this.$handler.$.path;

            if (path.indexOf(handlerRelativePath) !== 0) {
                callback(new Error("Handler path '" + handlerRelativePath + "' not at start of " + path));
                return;
            }

            // remove relative handler path from path
            path = path.substring(handlerRelativePath.length);

            var pathElements = path.split('/');

            // remove first empty path
            pathElements.shift();

            this._getResourceForPath(pathElements, callback);
        },

        /***
         *
         * @param {Array} pathElements
         * @param {Function} callback
         * @callback {srv.handler.rest.Resource}
         *
         * @private
         */
        _getResourceForPath: function(pathElements, callback) {
            var self = this,
                configuration = this.$handler.$dataSourceConfiguration,
                parentResource = null,
                resourceClassName,
                resourceStack = [];

            // build a stack of configurations

            for (var i = 0; i < pathElements.length; i += 2) {
                var path = pathElements[i];
                configuration = configuration.getConfigurationForPath(path);

                if (!configuration) {
                    callback(new Error("Configuration for '" + pathElements.slice(0, i + 1).join('/') + "' not found."));
                    return;
                }

                resourceClassName = configuration.$.resourceClassName;
                if (!resourceClassName) {
                    callback(new Error("No resource for '" + pathElements.join('/') + "' found"));
                    return;
                }

                resourceStack.push({
                    resourceClassName: resourceClassName,
                    configuration: configuration,
                    id: pathElements[i + 1]
                });

            }

            // go through resource stack and create resources
            flow()
                .parEach(resourceStack, function(resourceEntry, cb) {
                    self._createResourceInstance(resourceEntry, parentResource, function(err, resource) {
                        if (!err) {
                            parentResource = resource;
                        }
                        cb(err, resource);
                    });
                })
                .exec(function(err) {
                    // return the latest resource
                    callback(err, parentResource);
                });

        },


        _createResourceInstance: function(resourceEntry, parentResource, callback) {
            var applicationContext = this.$handler.$stage.$applicationContext,
                fqClassName = applicationContext.getFqClassName(null, resourceEntry.resourceClassName);

            require([fqClassName], function(resourceFactory) {
                var resource = applicationContext.createInstance(resourceFactory, [resourceEntry.configuration, parentResource]);
                if (resource instanceof Resource) {
                    callback(null, resource);
                } else {
                    callback("Returned resource not an instance of Resource");
                }
            }, callback);


        }
    })
});