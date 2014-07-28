define(["js/data/Entity", "underscore"], function (Entity, _) {

    return Entity.FieldTransformer.inherit({
        _transformValue: function (field, value, schemaObject) {

            if (schemaObject.type === String && _.isString(value)) {
                return (value || "").trim();
            }

            return value;
        }
    });

});