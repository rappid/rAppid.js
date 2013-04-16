define(["js/data/Model","rest/model/IssueType","js/data/Collection"], function(Model, IssueType, Collection) {
    return Model.inherit("rest.model.Project", {
        schema: {
            issueTypes: Collection.of(IssueType)
        },
        idField: "name"
    });
});