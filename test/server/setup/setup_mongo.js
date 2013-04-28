db.createCollection("projects");

db.createCollection("tickets");
db.tickets.ensureIndex({key: 1}, {unique: true});

db.createCollection("comments");
db.createCollection("users");