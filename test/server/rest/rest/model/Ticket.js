define(["js/data/Model","rest/model/Project","rest/model/User","js/data/Collection","rest/model/Comment"], function(Model, Project, User, Collection, Comment) {
    return Model.inherit("rest.model.Ticket", {
        schema: {
            summary: String,
            description: {
                type: String,
                required: false
            },
            assignee: {
                type: User,
                required: false
            },
            project: Project,
            comments: Collection.of(Comment),
            watchers: [User]
        },
        idField: "key"
    });
});