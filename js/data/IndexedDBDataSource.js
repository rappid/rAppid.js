define(['js/data/KeyValueDataSource','require'], function(KeyValueDataSource, require){


    return KeyValueDataSource.inherit('js.data.IndexedDBDataSource', {

        defaults: {
            database: null
        },

        ctor: function(){

            this.callBase();
        },

        _initializationComplete: function(){
            this.callBase();

            var window = this.$stage.$window;
            var indexedDB;
            if(window){
                indexedDB = window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            }
            if(!indexedDB){
                throw new Error('No Indexed DB available');
            }

            this.$indexedDB = indexedDB;
        },

        connectToResource: function(resourceConfiguration, callback){
            if (!this.$.database) {
                throw new Error("No database defined");
            }

            var request = this.$indexedDB.open(this.$.database);
            var self = this,
                isNew = false;

            request.onupgradeneeded = function () {
                // The database did not previously exist, so create object stores and indexes.
                self.$db = request.result;
                isNew = true;
                var modelClass = require(resourceConfiguration.$.modelClassName.replaceAll(/\./,"/"));
                self.$db.createObjectStore(resourceConfiguration.$.path, {keyPath: modelClass.idField});
            };

            request.onsuccess = function () {
                self.$db = request.result;
                callback && callback(null, self.$db, isNew);
            };



        },

        _internalLoadModel: function(configuration, where, callback){

            this.connectToResource(configuration, function(err, db, isNew){
                if(!err){
                    if(isNew){
                        callback(KeyValueDataSource.NOT_FOUND);
                    } else {
                        var tx = db.transaction(configuration.$.path, "read");
                        var store = tx.objectStore(configuration.$.path);
                        var modelClass = require(configuration.$.modelClassName.replaceAll(/\./, "/"));

                        if(isNew){
                            var unique = false;
                            for(var key in where){
                                if(where.hasOwnProperty(key)){
                                    unique = (key === modelClass.prototype.idField);
                                    store.createIndex(key, key, {unique: unique});
                                }
                            }

                        }
                        var index = store.index(modelClass.idField);

                        var request = index.get("Bedrock Nights");
                        request.onsuccess = function () {
                            var matching = request.result;
                            if (matching !== undefined) {
                                // A match was found.
                                report(matching.isbn, matching.title, matching.author);
                            } else {
                                // No match was found.
                                report(null);
                            }
                        };
                    }
                }

            });

        },

        _internalLoadCollectionPage: function(collectionPage, configuration, params, options, callback){
            // todo: implement


        }


    });

});