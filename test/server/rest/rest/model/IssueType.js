define(["js/data/Model"], function (Model) {
    return Model.inherit("rest.model.IssueType", {
        schema: {
            name: {
                type: String,
                required: false
            }
        },
        idField: "key"
    });
});