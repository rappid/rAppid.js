define(['require', 'js/core/Bindable', 'js/core/List', 'js/data/Collection', 'js/data/Model'], function(require, Bindable, List, Collection, Model) {
    var cid = 0;

    var Entity = Bindable.inherit('js.core.Entity', {

        ctor: function(attributes) {

            Model = Model || require('js/data/Model');

            // generate unique id
            this.$cid = ++cid;


            if (!Collection) {
                Collection = require('js/data/Collection');
            }

            this._extendSchema();

            this.callBase(attributes);
        },

        $schema: {},

        $context: null,

        $dependentObjectContext: null,

        $cacheInRootContext: false,

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

            if (childFactory && childFactory.classof(Entity) && !childFactory.classof(Model)) {
                // dependent object, which should be cached in context of the current entity
                if (!this.$dependentObjectContext) {
                    // create a new non-cached context for dependent objects
                    this.$dependentObjectContext = this.$context.$datasource.createContext();
                }

                return this.$dependentObjectContext;
            }


            return this.$context;
        },

        /**
         * parse the deserializied data
         * @param data
         */
        parse: function (data) {

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
                                        entity.set(entity.parse(value[i]));
                                        list.add(entity);
                                    }
                                }

                            } else {
                                throw 'Schema for type "' + type + '" requires to be an array';
                            }
                        } else if (schemaType.classof(Collection)) {

                            // set alias to type if generic collection
                            alias = (schemaType === this.$context.$datasource.$collectionFactory) ? type : schemaType.prototype.$alias;

                            list = data[type] = this.getContextForChildren(schemaType).createCollection(schemaType, null, alias);
                            list.set(value);

                            if (value instanceof Array || value === null) {

                                for (i = 0; i < value.length; i++) {
                                    // create new entity based on collection type
                                    entity = new list.$modelFactory();
                                    entity.set(entity.parse(value[i]));
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
                            entity.set(entity.parse(value));
                        }
                    }
                }
            }


            return data;
        },

        /***
         * prepares the data for serialisation
         * @param attributes
         * @param action
         * @return {Object} all data that should be serialized
         */
        prepare: function (attributes, action) {
            return attributes;
        }

    });

    Entity.schema = {};

    return Entity;

});