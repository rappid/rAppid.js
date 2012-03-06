var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.core.Model", ["js.core.Bindable"], function (Bindable) {

        var cid = 0;

        return Bindable.inherit({
            ctor: function (attributes) {
                this.callBase(attributes);
                this.$cid = ++cid;
            },
            save: function (options, callback) {
                this.$context.$datasource.save(options, callback);
            },
            fetch: function (options, callback) {
                this.$context.$datasource.load(this, options, callback);
            },
            remove: function (options, callback) {
                this.$context.$datasource.remove(options, callback);
            },
            /**
             * prepares the data for serialisation
             * @return {Object} all data that should be serialized
             */
            prepare: function() {
                var ret = {};

                for (var key in this.$) {
                    if (this.$.hasOwnProperty(key)) {
                        var value = this.$[key];
                        if (!rAppid._.isFunction(value)) {
                            ret[key] = value;
                        }
                    }
                }

                return ret;
            },

            /**
             * parse the deserializied data
             * @param data
             */
            parse: function(data) {
                return data;
            },

            status: function() {
                if (this.$.id === false) {
                    return "DELETED";
                } else {
                    return this.$.id ? "CREATED" : "NEW";
                }
            }.on("id")

        });
    });
});