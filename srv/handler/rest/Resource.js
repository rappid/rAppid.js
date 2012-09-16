define(['js/core/Base', 'srv/core/HttpError'], function(Base, HttpError) {
    return Base.inherit('srv.handler.rest.Resource', {

        ctor: function(configuration, parentResource) {
            this.$context = null;

            this.$resourceConfiguration = configuration;
            this.$parentResource = parentResource;

            this.callBase();
        },

        $collectionMethodMap: {
            GET: "_index",
            POST: "_create"
        },

        $modelMethodMap: {
            GET: "_retrieve",
            PUT: "_update",
            DELETE: "_delete"
        },

        _isCollectionResource: function() {
            return !!this.$resourceConfiguration.id;
        },

        handleRequest: function(context, callback) {
            this.$context = context;

            var method = this._getRequestMethod(context),
                map = this._isCollectionResource ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];

            if (fn instanceof Function) {
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

        _retrieve: function(context, callback) {
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