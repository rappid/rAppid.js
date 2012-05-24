define(["js/data/DataSource", "js/core/List", "underscore"], function(DataSource, List, _){

    var undef,
        referenceCollectionTypeExtractor = /^.*\/([^/]+)$/i,
        referenceModelTypeExtractor = /^.*\/([^/]+)\/(\w+)$/i;

    return DataSource.inherit("js.data.LocalStorageDataSource", {

        loadModel: function(model, options, callback) {

            if (!model) {
                throw "model not defined";
            }

            if (model.status != "CREATED") {
                throw "model not created";
            }

            if (!(window && window.localStorage)) {
                // local storage not supported
                if (callback) {
                    callback("local storage not supported");
                }
                return;
            }

            try {
                var cacheId = model.modelClassName + "_" + model.$.id;
                var data = localStorage.getItem(cacheId);

                if (data === undef) {
                    // data not found in local storage
                    if (callback) {
                        callback("data not found");
                    }

                    return;
                }

                self.resolveReferences(model, data, options, function (err, resolvedData) {
                    if (!err) {
                        model.set(resolvedData);
                    }

                    callback(err, model, options);
                });

            } catch (e) {
                if (callback) {
                    callback(e);
                }
            }

        },

        loadCollectionPage: function(page, options, callback) {
            if (!(window && window.localStorage)) {
                // local storage not supported
                if (callback) {
                    callback("local storage not supported");
                }

                return;
            }

            var cacheId = page.$collection.$options.type;
            var data = localStorage.getItem(cacheId);

            if (data !== undef) {
                if (data instanceof Array) {
                    // set meta data
                    page.$collection.$itemsCount = data.length;

                    this.resolveReferences(page, data, options, function(err, resolvedData) {
                        if (!err) {
                            page.add(resolvedData);
                        }

                        callback(err, page, options);
                    })

                } else {
                    callback("collection data not an array");
                }
            } else {
                callback(null, page, options);
            }
        },


        isReferencedModel: function (obj) {
            return obj.hasOwnProperty("id") && obj.hasOwnProperty("href") &&
                _.keys(obj).length === 2 && obj["href"].indexOf("localStorage://") === 0;
        },

        isReferencedCollection: function (obj) {
            return !obj.hasOwnProperty("id") && obj.hasOwnProperty("href") &&
                _.keys(obj).length === 2 && obj["href"].indexOf("localStorage://") === 0;
        },

        getReferenceInformation: function (reference, id) {
            // url is something like
            // http://example.com/api/context/resourceType/id

            var extractor = id ? referenceModelTypeExtractor : referenceCollectionTypeExtractor;

            var match = extractor.exec(reference);
            if (match) {
                var path = match[1];

                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var config = this.$configuredTypes[i];

                    if (config.$.path == path) {
                        return {
                            context: this.getContextPropertiesFromReference(reference),
                            modelClassName: config.$.modelClassName,
                            requireClassName: this.$systemManager.$applicationContext.getFqClassName(config.$.modelClassName),
                            type: config.$.alias,
                            id: id,
                            path: path
                        }
                    }
                }
            }

            // could not retrieve reference information
            return null;
        },


        /***
         *
         * @param {js.data.Model|js.data.Collection} target
         * @param data data containing the references
         * @param options
         * @param callback
         */
        resolveReferences: function (target, data, options, callback) {

            // first identify all needed model classes
            var referenceInformation = [],
                self = this;

            function findReferences(obj, api) {

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        var value = obj[prop];

                        if (value instanceof List) {
                            value.each(function (item) {
                                findReferences(item, api);
                            });
                        } else if (value instanceof Object) {
                            // value is object and could contain sub objects with references
                            // first resolve references

                            findReferences(value, api);

                            if (self.isReferencedModel(value) || self.isReferencedCollection(value)) {
                                var info = self.getReferenceInformation(value[self.$.referenceProperty], value[self.$.identifierProperty]);
                                if (info) {
                                    info.referenceObject = obj;
                                    info.propertyName = prop;
                                    referenceInformation.push(info);
                                } else {
                                    throw "Cannot determinate referenceInformation for reference '" + value[self.$.referenceProperty] + "'.";
                                }
                            }
                        }
                    }
                }
            }

            findReferences(data);

            var requiredClasses = [];
            for (var i = 0; i < referenceInformation.length; i++) {
                var info = referenceInformation[i];
                var requiredClassname = info.requireClassName;

                if (_.indexOf(requiredClasses, requiredClassname) == -1) {
                    requiredClasses.push(requiredClassname);
                }
            }

            // require model classes

            // TODO: how to handle errors here? require.onError?
            // some unique hash and extending of requirejs required
            require(requiredClasses, function () {
                var factories = Array.prototype.slice.call(arguments);

                for (var i = 0; i < referenceInformation.length; i++) {
                    var info = referenceInformation[i];
                    var factory = factories[_.indexOf(requiredClasses, info.requireClassName)];

                    if (factory) {
                        // create instance in correct context

                        var context = self.getContext(info.context, target.$context);

                        var isModel = info.id;

                        var referenceInstance = isModel ?
                            self.createEntity(factory, info.id, info.type, context) :
                            self.createCollection(factory, {
                                path: info.path
                            }, info.type, context);

                        if (referenceInstance) {
                            var value = info.referenceObject[info.propertyName];
                            info.referenceObject[info.propertyName] = referenceInstance;

                            if (isModel) {
                                referenceInstance.set(value);
                            } else {
                                // TODO: set loaded data for collection, if available in payload
                            }

                        } else {
                            callback("Instance for model '" + info.className + "' couldn't be created");
                        }

                    } else {
                        callback("Factory for class '" + info.className + "' missing");
                    }

                }

                callback(null, data);
            });
        }


    });
});
