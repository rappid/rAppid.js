define(["require", "js/data/DataSource", "js/core/Base", "js/core/List", "underscore", "js/data/Model", "js/data/Collection"],
    function (require, DataSource, Base, List, _, Model, Collection) {


        var referenceCollectionTypeExtractor = /^.*\/([^/]+)$/i,
            referenceModelTypeExtractor = /^.*\/([^/]+)\/(\w+)$/i;


        var ReferenceDataSource = DataSource.inherit("js.data.ReferenceDataSource", {
            ctor: function () {
                this.callBase();

                this.$processors = [];
                this.initializeProcessors();
            },

            initializeProcessors: function () {
                // hook
            },

            defaults: {
                identifierProperty: "id",
                referenceProperty: "href",
                // endPoint on which references will be checked
                endPoint: ""
            },

            /***
             *
             * serialize the javascript data as string
             *
             * @param {Object} data
             * @return {String}
             */
            serialize: function (data) {
                return JSON.stringify(data);
            },

            /***
             * deserialize the input into javascript object
             * @param {*} input
             * @return {Object}
             */
            deserialize: function (input) {
                // TODO: enable IE7 and FF3 support? Or should the user add json2.js lib
                return JSON.parse(input);
            },

            /***
             *
             * Determinate if a reference points to a model
             *
             * @param {Object} obj
             * @return {Boolean} true if the reference points to a model
             */
            isReferencedModel: function (obj) {
                return obj.hasOwnProperty(this.$.identifierProperty) && obj.hasOwnProperty(this.$.referenceProperty)
                    && obj[this.$.referenceProperty].indexOf(this.$.endPoint) === 0;
            },

            /***
             * Determinate if a reference points to a collection
             * @param {Object} obj
             * @return {Boolean}
             */
            isReferencedCollection: function (obj) {
                return !obj.hasOwnProperty(this.$.identifierProperty) && obj.hasOwnProperty(this.$.referenceProperty)
                    && obj[this.$.referenceProperty].indexOf(this.$.endPoint) === 0;
            },


            /***
             *
             * @param {String} reference
             * @param {String} [id]
             * @return {js.data.ReferenceDataSource.ReferenceInformation}
             */
            getReferenceInformation: function (reference, id) {
                // reference is something like
                // http://example.com/api/context/resourceType/id

                var extractor = id ? referenceModelTypeExtractor : referenceCollectionTypeExtractor;

                var match = extractor.exec(reference);
                if (match) {
                    var path = match[1];

                    for (var i = 0; i < this.$configuredTypes.length; i++) {
                        var config = this.$configuredTypes[i];

                        if (config.$.path == path) {
                            return new ReferenceDataSource.ReferenceInfomation(
                                this.getContextPropertiesFromReference(reference),
                                id ? config.$.modelClassName : config.$.collectionClassName,
                                this.$systemManager.$applicationContext.getFqClassName(config.$.modelClassName),
                                config.$.alias,
                                id,
                                path
                            );
                        }
                    }
                }

                // could not retrieve reference information
                return null;
            },

            /***
             *
             * @param [js.data.Model|js.data.Collection] target
             * @param data data containing the references
             * @param options
             * @param callback
             */
            resolveReferences: function (target, data, options, callback) {
                // models and collections will be referenced by reference pointer

                // first identify all needed model classes
                var referenceInformation = [],
                    self = this;

                function findReferences(obj) {

                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            var value = obj[prop];

                            if (value instanceof List) {
                                value.each(function (item) {
                                    findReferences(item);
                                });
                            } else if (value instanceof Object || value instanceof Array) {
                                // value is object and could contain sub objects with references
                                // first resolve references

                                findReferences(value);

                                // then check the value
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
                // build a map of required classes
                for (var i = 0; i < referenceInformation.length; i++) {
                    var info = referenceInformation[i];
                    var requiredClassName = info.requireClassName;

                    if (_.indexOf(requiredClasses, requiredClassName) == -1) {
                        requiredClasses.push(requiredClassName);
                    }
                }

                // require model classes

                // TODO: how to handle errors here? require.onError? Some unique hash and extending of requirejs required
                require(requiredClasses, function () {
                    var factories = Array.prototype.slice.call(arguments);

                    for (var i = 0; i < referenceInformation.length; i++) {
                        var info = referenceInformation[i];
                        var factory = factories[_.indexOf(requiredClasses, info.requireClassName)];

                        if (factory) {
                            // create new instance in correct context

                            // so get the correct context
                            var context = self.getContext(info.context, target.$context);

                            // do we handle model or collections here
                            var isModel = info.id;

                            // create instance in the correct context
                            var referenceInstance = isModel ?
                                self.createModel(factory, info.id, info.type, context) :
                                self.createCollection(factory, {
                                    path: info.path
                                }, info.type, context);

                            if (referenceInstance) {
                                // remember original value
                                var value = info.referenceObject[info.propertyName];
                                // and store the new instance instead of the reference
                                info.referenceObject[info.propertyName] = referenceInstance;

                                if (isModel) {
                                    referenceInstance.set(value);
                                } else {
                                    // TODO: set loaded data for collection, if available in payload
                                }
                            } else {
                                callback("Instance for '" + info.className + "' couldn't be created");
                                return;
                            }

                        } else {
                            callback("Factory for class '" + info.className + "' missing");
                            return;
                        }
                    }

                    callback(null, data);
                });
            },

            createReferences: function(target, data, options, callback) {

                function createReference(obj) {

                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            var value = obj[prop];

                            if (value instanceof List) {
                                value.each(function (item) {
                                    createReference(item);
                                });
                            } else if (value instanceof Object || value instanceof Array) {
                                // value is object and could contain sub objects with references
                                // first resolve references

                                createReference(value);

                                // then check the value
                                if (value instanceof Model || value instanceof Collection) {
//                                    var info = self.getReferenceInformation(value[self.$.referenceProperty], value[self.$.identifierProperty]);
//                                    if (info) {
//                                        info.referenceObject = obj;
//                                        info.propertyName = prop;
//                                        referenceInformation.push(info);
//                                    } else {
//                                        throw "Cannot determinate referenceInformation for reference '" + value[self.$.referenceProperty] + "'.";
//                                    }
                                }
                            }
                        }
                    }
                }

                createReference(data);
            },

            /**
             *
             * @param model
             * @param options
             * @param callback function(err, model, options)
             */
            loadModel: function (model, options, callback) {
            }

        });

        ReferenceDataSource.ReferenceInfomation = Base.inherit("js.data.ReferenceDataSource.ReferenceInformation", {
            /***
             *
             * @param {js.data.DataSource.Context} context
             * @param {String} className full qualified name of the modelClass or CollectionClass
             * @param {String} requireClassName requirejs name for the class
             * @param {String} type
             * @param {String} [id]
             * @param {String} [path]
             */
            ctor: function (context, className, requireClassName, type, id, path) {
                this.context = context;
                this.classname = className;
                this.requireClassName = requireClassName;
                this.type = type;
                this.id = id;
                this.path = path;
            }
        });

        return ReferenceDataSource;

    }
);