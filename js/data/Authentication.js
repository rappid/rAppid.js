define(["js/data/Model"], function (Model) {

    return Model.inherit('js.data.Authentication', {

        schema: {
            username: String,
            password: String,
            data: {
                type: Object,
                required: false
            },
            userId: {
                type: Object,
                required: false
            }

        },

        idField: "token"

    });

});