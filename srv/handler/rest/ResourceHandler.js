define(['js/core/Base', 'srv/core/HttpError', 'flow', 'require', 'JSON', 'js/data/Collection'], function(Base, HttpError, flow, require, JSON, Collection) {
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

            context.request.setEncoding('utf8');

            var method = this._getRequestMethod(context),
                map = this._isCollectionResource() ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];


            if (fn instanceof Function) {
                context.dataSource = this.getDataSource();

                var body = "";
                context.request.on('data', function (data) {
                    body += data;
                });

                var self = this;
                context.request.on('end', function () {
                    if(body !== ""){
                        // TODO: handle different payload formats -> query string
                        try{
                            context.request.params = JSON.parse(body);
                        }catch(e){
                            console.warn("Couldn't parse " + body);
                        }
                    }
                    fn.call(self, context, callback);
                });

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
        _getModelFactory: function(){
            return require(this.$resourceConfiguration.$.modelClassName.replace(/\./g,'/'));
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _index: function(context, callback) {
            var modelFactory = this._getModelFactory();
            var collection = context.dataSource.createCollection(Collection.of(modelFactory));

            // TODO: read out offset, limit and query from query string
            collection.fetch({}, function(err, collection){
                if(!err){
                    var response = context.response;
                    var body = "", results = [];

                    // switch context of collection to restdatasource

                    // call compose

                    // TODO: serialize and compose item
                    collection.each(function(item){
                        // TODO: compose and serialize item
                        results.push(item.$);
                    });

                    var res = {
                        results: results,
                        totalCount: collection.$itemsCount
                    };

                    body = JSON.stringify(res);

                    response.writeHead(200, "", {
                        'Content-Length': body.length,
                        'Content-Type': 'application/json'
                    });

                    response.write(body);
                    response.end();
                }


                callback(err);
            });
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _create: function(context, callback) {
            var modelFactory = this._getModelFactory();
            var model = context.dataSource.createEntity(modelFactory);

            var payload = context.request.params;
            model.set(payload);

            // TODO: add options
            model.save({}, function (err, model) {
                if (!err) {
                    // TODO: write response
                    callback(null);
                } else {
                    callback(new HttpError(err, 500));
                }
            });
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _show: function(context, callback) {
            var modelFactory = this._getModelFactory();
            var model = context.dataSource.createEntity(modelFactory,this.$resourceId);

            // TODO: add options
            model.fetch({}, function(err, model){
                if(!err){

                    callback(null);
                }else{
                    callback(new HttpError(err, 500));
                }
            });
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _update: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _delete: function(context, callback) {
            throw new HttpError("Not implemented", 500);
        }

    });
});