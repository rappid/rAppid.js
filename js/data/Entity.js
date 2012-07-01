define(['require', 'js/core/Bindable', 'js/core/List'],
    function(require, Bindable, List) {
    var Collection;

    var Entity = Bindable.inherit('js.core.Entity', {

        ctor: function(attributes) {

            this._extendSchema();

            this.callBase(attributes);
        },

        $schema: {},

        $context: null,

        $dependentObjectContext: null,

        $cacheInRootContext: false,

        $isDependentObject: true,

        _extendSchema: function () {
            var base = this.base;

            while (base instanceof Entity) {
                var baseSchema = base.$schema;
                for (var type in baseSchema) {
                    if (baseSchema.hasOwnProperty(type) && !this.$schema.hasOwnProperty(type)) {
                        this.$schema[type] = baseSchema[type];
                    }
                }
                base = base.base;
            }
        },

        getContextForChildren: function(childFactory) {

            if (childFactory.prototype.$cacheInRootContext) {
                return this.$context.$datasource.getContext();
            }

            // TODO: this is the circle dependency. check different than use model
            if (this._isChildFactoryDependentObject(childFactory)) {
                // dependent object, which should be cached in context of the current entity
                if (!this.$dependentObjectContext) {
                    // create a new non-cached context for dependent objects
                    this.$dependentObjectContext = this.$context.$datasource.createContext();
                }

                return this.$dependentObjectContext;
            }


            return this.$context;
        },

        _isChildFactoryDependentObject: function(childFactory) {
            return childFactory && childFactory.prototype.$isDependentObject;
        },

        /**
         * parse the deserializied data
         * @param data
         */
        parse: function (data, action, options) {

            if (!Collection) {
                try {
                    Collection = require('js/data/Collection');
                } catch (e) {
                    // because a circular dependency from Entity -> Collection and Collection -> Model -> Entity
                    // we require Collection here, and if Collection is specified as schema, we can use it here
                }
            }

            var processor = this.$context.$datasource.getProcessorForModel(this);
            data = processor.parse(data, action, options);

            var schema = this.$schema;

            // convert top level properties to Models respective to there schema
            for (var type in schema) {
                if (schema.hasOwnProperty(type)) {
                    if (data.hasOwnProperty(type)) {
                        // found key in data payload

                        var value = data[type],
                            schemaType = schema[type],
                            factory,
                            entity,
                            i,
                            list,
                            alias;

                        if (schemaType instanceof Array) {
                            if (schemaType.length === 1) {
                                factory = schemaType[0];
                            } else if (schemaType.length === 0) {
                                this.log('ModelFactory for ListItem for "' + type + '" not defined', 'warn');
                                factory = Entity;
                            } else {
                                throw "Cannot determinate ModelFactory. Multiple factories defined for '" + type + "'.";
                            }

                            if (!(factory.prototype instanceof Entity)) {
                                throw "Factory for type '" + type + "' isn't an instance of Entity";
                            }

                            if (value instanceof Array || value === null) {
                                list = data[type] = new List();

                                // set alias to type if generic entity
                                alias = (factory === this.$context.$datasource.$entityFactory ||
                                    factory === this.$context.$datasource.$modelFactory) ? type : null;

                                if (value) {
                                    for (i = 0; i < value.length; i++) {
                                        entity = this.getContextForChildren(factory).createEntity(factory, value[i].id, alias);
                                        entity.set(entity.parse(value[i], action, options));
                                        list.add(entity);
                                    }
                                }

                            } else {
                                throw 'Schema for type "' + type + '" requires to be an array';
                            }


                        } else if (Collection && schemaType.classof(Collection)) {

                            // set alias to type if generic collection
                            alias = (schemaType === this.$context.$datasource.$collectionFactory) ? type : schemaType.prototype.$alias;

                            var contextForChildren = this.getContextForChildren(schemaType);
                            list = data[type] = contextForChildren.createCollection(schemaType, null, alias);
                            list.set(value);

                            if (value instanceof Array || value === null) {

                                for (i = 0; i < value.length; i++) {
                                    // create new entity based on collection type
                                    entity = contextForChildren.createEntity(list.$modelFactory);
                                    entity.set(entity.parse(value[i], action, options));
                                    // and add it to the collection
                                    list.add(entity);
                                }
                            } else {
                                // TODO: what here
//                                throw 'Schema for type "' + type + '" requires to be an array';
                            }
                        }
                        else {
                            factory = schemaType || Entity;

                            if (!(factory.prototype instanceof Entity)) {
                                throw "Factory for type '" + type + "' isn't an instance of Entity";
                            }

                            // set alias to type if generic entity
                            alias = (factory === this.$context.$datasource.$entityFactory ||
                                factory === this.$context.$datasource.$modelFactory) ? type : null;

                            data[type] = entity = this.getContextForChildren(factory).createEntity(factory, this.$.id, alias);
                            entity.set(entity.parse(value, action, options));
                        }
                    }
                }
            }

            return data;
        },

        prepare: function(action, options) {
            return this.$;
        },

        /***
         * composes the data for serialisation
         * @param action
         * @param options
         * @return {Object} all data that should be serialized
         */
        compose: function (action, options) {
            return this.prepare(action, options);
        }

//        preCompose: function (data, action, options) {
//            var processor = this.$context.$datasource.getProcessorForModel(this);
//            return processor.preCompose(data, action, options);
//        },
//
//        postCompose: function (data, action, options) {
//            var processor = this.$context.$datasource.getProcessorForModel(this);
//            return processor.postCompose(data, action, options);
//        }

    });


    return Entity;

});