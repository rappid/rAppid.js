db.createCollection("projects");
db.projects.ensureIndex({name: 1}, {unique: true});


db.createCollection("tickets");
db.tickets.ensureIndex({key: 1}, {unique: true});

db.createCollection("comments");
db.createCollection("users");
db.users.ensureIndex({email: 1}, {unique: true});
db.createCollection("issueTypes");
db.issueTypes.ensureIndex({key: 1}, {unique: true});


db.createCollection("identities");
db.createCollection("authentications");
