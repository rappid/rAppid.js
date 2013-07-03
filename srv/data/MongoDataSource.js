define(['js/data/KeyValueDataSource', 'js/data/DataSource', 'mongodb', 'js/data/Model', 'flow', 'underscore', 'js/data/Collection', 'srv/lib/MongoQueryComposer'], function (KeyValueDataSource, DataSource, MongoDb, Model, flow, _, Collection, MongoQueryComposer) {

    var ID_KEY = KeyValueDataSource.ID_KEY;

    MongoQueryComposer = MongoQueryComposer.MongoQueryComposer;

    /***
     * @inherit js.data.KeyValueDataSource.Processor
     */
    var MongoDataProcessor = KeyValueDataSource.Processor.inherit('src.data.MongoDataProcessor', {

        _getValueForKey: function (data, key, schemaType) {
            if (key === "id") {
                if (data[ID_KEY] instanceof MongoDb.ObjectID) {
                    return key.toHexString();
                }
            }

            return this.callBase();

        },

        _preParse: function (model, data, action, options) {
            function readId(fromField) {
                if (data[fromField] && !data.id) {
                    var _id = data[fromField];

                    if (_.isObject(_id) && _id instanceof MongoDb.ObjectID) {
                        data['id'] = _id.toHexString();
                    } else {
                        data['id'] = _id;
                    }
                    delete data[fromField];

                    return true;
                }

                return false;
            }

            readId(ID_KEY);
        }
    });

    var MongoDataSource = KeyValueDataSource.inherit('srv.data.MongoDataSource', {

        defaults: {
            username: null,
            password: null,
            collectionPageSize: 500,

            host: 'localhost',
            port: 27017,
            poolSize: 2,
            database: null,
            autoReconnect: true,
            w: 1
        },

        $defaultProcessorFactory: MongoDataProcessor,

        connect: function (callback) {

            var server = new MongoDb.Server(this.$.host, this.$.port, {});

            var db = new MongoDb.Db(this.$.database, server, {w: this.$.w});
            db.open(callback);
            return db;
        },

        _createIdObject: function (id) {
            return new MongoDb.ObjectID(id);
        },


        connectCollection: function (collectionName, hook, callback) {
            var connection,
                self = this;

            flow()
                .seq("client", function (cb) {
                    connection = self.connect(cb);
                })
                .seq("collection", function () {
                    return new MongoDb.Collection(this.vars["client"], collectionName);
                })
                .seq(function (cb) {
                    hook(this.vars['collection'], cb);
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }

                    callback(err);
                });
        },

        _internalSaveModel: function (configuration, where, object, options, callback) {
            var method;

            if (options.action === DataSource.ACTION.UPDATE) {
                method = MongoDataSource.METHOD.SAVE;
            } else if (options.action === DataSource.ACTION.CREATE) {
                method = MongoDataSource.METHOD.INSERT;
            }

            this.connectCollection(configuration.$.path, function (collection, cb) {
                if (method === MongoDataSource.METHOD.INSERT) {
                    collection.insert(object, options, function (err, objects) {
                        if (!err) {
                            object = objects[0];
                        }
                        cb(err);
                    });
                } else if (method === MongoDataSource.METHOD.SAVE) {
                    collection.findAndModify(where, {}, object, options, function (err, data, info) {
                        if (!err) {
                            if (!options.upsert && !data) {
                                // no update happened
                                err = DataSource.ERROR.NOT_FOUND;
                            }
                            var idObject;
                            if (info.lastErrorObject && !info.lastErrorObject.updatedExisting) {
                                idObject = info.lastErrorObject.upserted;
                            } else if (info.value) {
                                idObject = info.value[ID_KEY];
                            }

                            if (idObject && options.createdField) {
                                object[options.createdField] = idObject.getTimestamp();
                            }
                        }
                        cb(err);
                    });
                } else {
                    cb("Wrong method");
                }
            }, function (err) {
                callback(err, object);
            });
        },


        _internalLoadModel: function (configuration, where, callback) {
            var result;
            this.connectCollection(configuration.$.path, function (collection, cb) {
                collection.findOne(where, function (err, object) {
                    if (!err) {
                        if (!object) {
                            err = DataSource.ERROR.NOT_FOUND;
                        }
                        result = object;
                    }
                    cb(err);
                });
            }, function (err) {
                callback(err, result);
            });
        },

        _internalRemove: function (configuration, where, options, callback) {
            this.connectCollection(configuration.$.path, function (collection, cb) {
                collection.remove(where, {safe: true}, function (err, count) {
                    if (count === 0) {
                        err = DataSource.ERROR.NOT_FOUND;
                    }
                    callback(err);
                });
            }, function (err) {
                callback(err);
            });
        },

        _internalLoadCollectionPage: function (collectionPage, configuration, params, options, callback) {

            var sort;

            if (params.sort) {
                sort = params.sort;
            }

            var items;
            this.connectCollection(configuration.$.path, function (collection, cb) {
                flow()
                    .seq("cursor", function (cb) {
                        var cursor = collection.find(params.where);
                        if (sort) {
                            cursor = cursor.sort(sort);
                        }

                        cursor = cursor.limit(params.limit);
                        cursor = cursor.skip(params.offset);


                        cursor.toArray(function (err, results) {
                            if (!err) {
                                items = results;
                            }

                            cb(err, cursor);
                        });
                    })
                    .seq("count", function (cb) {
                        this.vars["cursor"].count(cb);
                    })
                    .exec(function (err, results) {
                        callback(err, {
                            count: results.count,
                            results: items
                        });
                    });
            }, function (err) {
                callback(err);
            });
        },

        _internalCountCollection: function (configuration, params, options, callback) {
            var count;

            this.connectCollection(configuration.$.path, function (collection, cb) {
                flow()
                    .seq("cursor", function (cb) {
                        cb(null, collection.find(params.where));
                    })
                    .seq("count", function (cb) {
                        this.vars["cursor"].count(cb);
                    })
                    .exec(function (err, results) {
                        if (!err) {
                            count = results["count"];
                        }
                        cb(err);
                    });
            }, function (err) {
                callback(err, count, options);
            });

        },

        getQueryComposer: function () {
            return MongoQueryComposer;
        }
    });

    MongoDataSource.METHOD = {
        SAVE: 'save',
        INSERT: 'insert'
    };

    return MongoDataSource;
});