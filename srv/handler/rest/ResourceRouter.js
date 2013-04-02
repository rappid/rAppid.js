define(['require', 'js/core/Base', 'srv/handler/rest/ResourceHandler', 'flow'], function (require, Base, ResourceHandler, flow) {

    return Base.inherit('srv.handler.rest.ResourceRouter', {

        ctor: function(restHandler) {
            this.$restHandler = restHandler;
        },

        /***
         *
         * @param {srv.core.Context} context
         * @param {Function} callback - function(err, resource)
         *
         */
        getResource: function(context, callback) {

            var path = context.request.urlInfo.pathname,
                relativePath = this.$restHandler.$.path;

            if (path.indexOf(relativePath) !== 0) {
                callback(new Error("Handler path '" + relativePath + "' not at start of " + path));
                return;
            }

            // remove relative handler path from path
            path = path.substring(relativePath.length);

            var pathElements = path.split('/');

            // remove first empty path
            pathElements.shift();

            try {
                callback(null, this._getResourceForPath(pathElements));
            } catch (e) {
                callback(e);
            }
        },

        /***
         *
         * @param {Array} pathElements
         * @param {Function} callback
         * @callback {srv.handler.rest.Resource}
         *
         * @private
         */
        _getResourceForPath: function(pathElements) {
            var configuration = this.$restHandler.$resourceConfiguration,
                parentResourceHandler = null,
                resourceStack = [],
                i;

            // build a stack of configurations
            for (i = 0; i < pathElements.length; i += 2) {
                var path = pathElements[i];
                configuration = configuration.getConfigurationForPath(path);

                if (!configuration) {
                    throw new Error("Configuration for '" + pathElements.slice(0, i + 1).join('/') + "' not found.");
                }

                if(this.$restHandler.$modelClassResourceHandler[configuration.$.modelClassName]){
                    configuration.$.resourceHandler = this.$restHandler.$modelClassResourceHandler[configuration.$.modelClassName];
                }

                if (!configuration.$.resourceHandler) {
                    // no resource handler assigned to resource, use a default resource handler
                    configuration.$.resourceHandler = new ResourceHandler();
                }

                resourceStack.push({
                    resourceHandler: configuration.$.resourceHandler,
                    configuration: configuration,
                    id: pathElements[i + 1]
                });

            }

            for (i = 0; i < resourceStack.length; i++) {
                var resourceEntry = resourceStack[i],
                    resourceHandler = resourceEntry.resourceHandler;

                // clone or get same instance
                resourceHandler = resourceHandler.getResourceHandlerInstance();

                // initialize handler
                resourceHandler.init(this.$restHandler, resourceEntry.configuration, resourceEntry.id, parentResourceHandler);
                parentResourceHandler = resourceHandler;

                if (!(resourceHandler instanceof ResourceHandler)) {
                    throw "Returned resource not an instance of Resource";
                }
            }

            // return top mose resourceHandler
            return parentResourceHandler;

        }
    });
});