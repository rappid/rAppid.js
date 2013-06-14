define(["js/data/Model", "rest/model/Project", "rest/model/User", "js/data/Collection", "rest/model/Comment", "rest/model/IssueType"], function (Model, Project, User, Collection, Comment, IssueType) {
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
            issueType: {
                type: IssueType,
                required: false
            },
            comments: Collection.of(Comment),
            watchers: [User]
        },
        idField: "key"
    });
});