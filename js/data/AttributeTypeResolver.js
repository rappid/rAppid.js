define(['js/data/TypeResolver'], function(TypeResolver) {

    return TypeResolver.inherit('js.data.AttributeTypeResolver', {

        ctor: function(options) {
            options = options || {};
            options.attribute = options.attribute || "type";

            if (!options.mapping) {
                throw new Error("no mapping defined");
            }

            this.$options = options;
        },

        resolve: function(value, type) {

            var options = this.$options;
            var mapping = options.mapping;
            for (var key in mapping) {
                if (mapping.hasOwnProperty(key) && key === value[options.attribute]) {
                    // factory found -> return
                    return mapping[key];
                }
            }

            return null;
        }

    });

});