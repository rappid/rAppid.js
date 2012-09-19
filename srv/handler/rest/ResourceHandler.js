define(['js/core/Base', 'srv/core/HttpError', 'flow'], function(Base, HttpError, flow) {
    return Base.inherit('srv.handler.rest.ResourceHandler', {

        ctor: function(restHandler, configuration, resourceId, parentResource) {
            this.$context = null;
            this.$restHandler = restHandler;
            this.$resourceId = resourceId;

            this.$resourceConfiguration = configuration;
            this.$parentResource = parentResource;

            this.callBase();
        },

        $collectionMethodMap: {
            GET: "_index",
            POST: "_create"
        },

        $modelMethodMap: {
            GET: "_show",
            PUT: "_update",
            DELETE: "_delete"
        },

        _isCollectionResource: function() {
            return !this.$resourceId;
        },

        getDataSource: function(context) {
            context = context || this.$context;

            if (this.$parentResource) {
                return this.$parentResource.getDataSource(context);
            } else {
                return this.$restHandler.getDataSource(context);
            }
        },

        handleRequest: function(context, callback) {
            this.$context = context;

            var method = this._getRequestMethod(context),
                map = this._isCollectionResource() ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];

            if (fn instanceof Function) {

                context.$dataSource = this.getDataSource();

                fn(context, callback);
            } else {
                throw new HttpError("Method not supported", 404);
            }
        },

        /***
         * determinate the request method from the request
         *
         * @param {srv.core.Context} context
         * @return {String} method
         * @private
         */
        _getRequestMethod: function(context) {

            var parameter = context.request.urlInfo.parameter;
            if (parameter.method) {
                return parameter.method.toUpperCase();
            }

            return context.request.method;
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _index: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        },

        _create: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        },

        _show: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        },

        _update: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        },

        _delete: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        }

    });
});