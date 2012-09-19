define(['js/data/validator/Validator', 'js/data/Entity'], function(Validator, Entity) {

    return Validator.inherit('js.data.validator.SchemaValidator', {

        _validate: function(data) {
            if (!(data instanceof Entity)) {
                throw new Error("data must be an instance of Entity");
            }

            // TODO:
            throw new Error("Not implemented")
        }
    })
});