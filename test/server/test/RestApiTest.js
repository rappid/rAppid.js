var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    url = "http://localhost:8080/api";

describe("API", function () {

    var applicationJson = /application\/json/,
        textHtml = /text\/html/,
        ContentType = "Content-Type",
        LocationHeader = "Location-Header";

    function createProject(name, cb) {
        request(url)
            .put("/projects/" + name)
            .send({})
            .expect(200)
            .expect(ContentType, applicationJson)
            .end(cb)
    }

    function checkProject(name, cb) {
        request(url)
            .get("/projects/" + name)
            .expect(ContentType, applicationJson)
            .end(cb);
    }

    function createTicket(payload, cb) {
        request(url)
            .post("/tickets")
            .send(payload)
            .expect(201)
            .expect(ContentType, applicationJson)
            .expect("Location", new RegExp(["^", url, "/", "tickets", "/", (payload.project ? payload.project.name : "") + "\-[0-9]+", "$"].join("")))
            .end(cb);
    }

    describe("#Initial test", function () {

//        it("GET / should show available resources", function (done) {
//            request(url)
//                .get("/")
//                .expect(200)
//                .expect(ContentType, applicationJson)
//                .end(done);
//        });

        it("Check correct test setup", function (done) {

            flow()
                .parEach(["projects", "tickets", "users"], function (resource, cb) {

                    request(url)
                        .get("/" + resource)
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb);
                })
                .exec(done);


        })
    });

    describe('#PUT', function () {

        it('should create non existing resource if "upsert=true"', function (done) {
            var projectName = "abc";

            flow()
                .seq(function (cb) {
                    request(url)
                        .get("/projects/abc")
                        .expect(404)
                        .end(cb);
                })
                .seq("result", function (cb) {
                    createProject(projectName, cb);
                })
                .seq(function (cb) {
                    checkProject(projectName, cb);
                })
                .exec(done);
        });

        it('should return 404 for put on non existing resource with "upsert=false"', function (done) {

            flow()
                .seq(function (cb) {
                    request(url)
                        .put("/tickets/test-1")
                        .send({
                            summary: "Test Ticket",
                            project: {
                                name: "test"
                            },
                            watchers: []
                        })
                        .expect(404)
                        .expect(ContentType, textHtml)
                        .end(cb)
                })
                .exec(done);

        });

        it('should update resource with valid data', function (done) {
            var projectName = "awesome";

            flow()
                // create new project
                .seq(function (cb) {
                    createProject(projectName, cb);
                })
                // create new ticket
                .seq("result", function (cb) {
                    createTicket({
                        summary: "Awesome Ticket",
                        project: {
                            name: projectName
                        },
                        watchers: []
                    }, cb);
                })
                // update ticket!
                .seq(function (cb) {
                    var result = this.vars.result;
                    request(result.header.location)
                        .put('')
                        .send({
                            summary: "Super Awesome ticket",
                            project: {
                                name: projectName
                            },
                            watchers: []
                        })
                        .expect(ContentType, applicationJson)
                        .end(cb);
                })
                .seq("getResult", function (cb) {
                    var result = this.vars.result;
                    request(result.header.location)
                        .get('')
                        .expect(200)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.summary).to.equal("Super Awesome ticket");
                })
                .exec(done);
        });

        it('should return 400 if data is not valid', function (done) {
            flow()
                // create new ticket
                .seq("result", function (cb) {
                    createTicket({
                        summary: "Awesome Ticket",
                        project: {
                            name: "awesome"
                        },
                        watchers: []
                    }, cb);
                })
                // update ticket with invalid payload
                .seq(function (cb) {
                    var result = this.vars.result;
                    request(result.header.location)
                        .put('')
                        .send({
                            project: {
                                name: "awesome"
                            }
                        })
                        .expect(400)
                        .end(cb);
                })
                .exec(done);
        });

    });

    describe("#POST", function () {

        var location,
            projectName = "test";

        before(function (cb) {
            createProject(projectName, cb);
        });

        it('should not be allowed on resources which are created with PUT', function (done) {

            flow()
                .seq(function (cb) {
                    request(url)
                        .post("/projects/not-allowed-post")
                        .send({})
                        .expect(405)
                        .end(cb);
                })
                .exec(done);
        });

        it("should create new resource and return location header", function (done) {

            flow()
                .seq("result", function (cb) {
                    createTicket({
                        summary: "Test Ticket",
                        project: {
                            name: projectName
                        },
                        watchers: []
                    }, cb);
                })
                .seq(function (cb) {
                    var result = this.vars.result;
                    request(result.header.location)
                        .get('')
                        .expect(ContentType, applicationJson)
                        .end(cb);
                })
                .exec(done);
        });

        it('should return 400 with wrong linked models', function (done) {
            flow()
                .seq("result", function (cb) {
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Test Ticket",
                            project: {
                                name: projectName
                            },
                            issueType: {
                                key: "what"
                            },
                            watchers: []
                        })
                        .expect(400)
                        .end(cb);
                })
                .exec(done);
        });

        it('should create resources with unique ids', function (done) {
            var tickets = new Array(10);

            flow()
                .parEach(tickets, function (item, cb) {
                    createTicket({
                        summary: "Test Ticket",
                        project: {
                            name: projectName
                        },
                        watchers: []
                    }, cb);
                })
                .exec(done);

        });

        it("should return 400 with invalid payload", function (done) {

            flow()
                .seq("result", function (cb) {
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Test Ticket"
                        })
                        .expect(400)
                        .end(cb)
                })
                .exec(done);

        });


    });

    describe("#DELETE", function () {

        it("should delete resource if exists", function (done) {

            var projectId = "my-project-to-delete";

            flow()
                .seq("result", function (cb) {
                    createProject(projectId, cb);
                })
                .seq("delete", function (cb) {
                    request(url)
                        .del("/projects/" + projectId)
                        .send({})
                        .expect(200)
                        .end(cb);
                })
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects/" + projectId)
                        .expect(404)
                        .end(cb);
                })
                .exec(done);

        });

        it("should return 404 if resource wasn't found", function (done) {
            flow()
                .seq("delete", function (cb) {
                    request(url)
                        .del("/projects/not-existing-project")
                        .send({})
                        .expect(404)
                        .end(cb);
                })
                .exec(done);
        });

    });

    describe("#GET on Model Resource", function () {

        it("should return 404 if resource does not exist", function (done) {

            flow()
                .seq(function (cb) {
                    request(url)
                        .get("/projects/non-existing")
                        .expect(404)
                        .end(cb);
                })
                .exec(done);
        });

        it("should return data with correct href for existing resource", function (done) {

            var projectId = "my-new-project";


            flow()
                .seq("result", function (cb) {
                    createProject(projectId, cb);
                })
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects/" + projectId)
                        .expect(ContentType, applicationJson)
                        .expect(200)
                        .end(cb);
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.name).to.equal(projectId);
                    expect(result.body.href).to.equal(url + "/projects/" + projectId);
                })
                .exec(done);
        });

        it("should return href of linked models", function (done) {
            var projectId = "project-random";

            flow()
                .seq("result", function (cb) {
                    createProject(projectId, cb);
                })
                .seq(function (cb) {
                    request(url)
                        .get("/projects/" + projectId)
                        .expect(ContentType, applicationJson)
                        .expect(200)
                        .end(cb);
                })
                .seq("ticket", function (cb) {
                    createTicket({
                        summary: "Test Ticket",
                        project: {
                            name: projectId
                        },
                        watchers: []
                    }, cb);
                })
                .seq("getResult", function (cb) {
                    var result = this.vars.ticket;
                    request(result.header.location)
                        .get('')
                        .expect(200)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.project).to.eql({
                        name: projectId,
                        href: url + "/projects/" + projectId
                    });
                })
                .exec(done);

        });


        it("should return href of linked collections", function (done) {
            var projectId = "project-2";

            flow()
                .seq("result", function (cb) {
                    createProject(projectId, cb);
                })
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects/" + projectId)
                        .expect(ContentType, applicationJson)
                        .expect(200)
                        .end(cb);
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.name).to.equal(projectId);
                    expect(result.body.issueTypes).to.eql({
                        href: url + "/projects/" + projectId + "/issueTypes"
                    });
                })
                .exec(done);

        });

        it("should return href of linked model from other context", function (done) {

            var issueType = "bug",
                projectId = "project-with-issues";

            flow()
                .seq("result", function (cb) {
                    createProject(projectId, cb);
                })
                .seq(function (cb) {
                    request(url)
                        .put("/projects/" + projectId + "/issueTypes/" + issueType)
                        .send({})
                        .expect(200)
                        .end(cb);
                })
                .seq("ticket", function (cb) {
                    createTicket({
                        summary: "Ticket with IssueType",
                        project: {
                            name: projectId
                        },
                        issueType: {
                            key: projectId + "/" + issueType
                        },
                        watchers: []
                    }, cb);
                })
                .seq("getResult", function (cb) {
                    var result = this.vars.ticket;
                    request(result.header.location)
                        .get('')
                        .expect(200)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.issueType).to.eql({
                        key: issueType,
                        href: url + "/projects/" + projectId + "/issueTypes/" + issueType
                    });
                })
                .exec(done);

        });
    });

    describe("#GET on Collection Resource", function () {


        var count = 10,
            initialCount = 0,
            items = [];
        for (var i = 0; i < count; i++) {
            items.push("random-project-" + (i + 1));
        }

        before(function (done) {
            flow()
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects")
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.offset).to.equal(0);
                    expect(result.body.limit).to.exist;
                    expect(result.body.count).to.exist;
                    initialCount = result.body.count;
                })
                .parEach(items, function (item, cb) {
                    createProject(item, cb);
                })
                .seq("collectionResult", function (cb) {
                    request(url)
                        .get("/projects")
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.collectionResult;
                    expect(result.body.results).to.be.an.instanceof(Array);
                    var project;
                    for (var i = 0; i < result.body.results.length; i++) {
                        project = result.body.results[i];
                        expect(project.name).to.exist;
                    }
                })
                .exec(done);
        });

        it("should return 404 of resource was not found", function (done) {
            flow()
                .seq(function (cb) {
                    request(url)
                        .get("/non-existing-resource")
                        .expect(404)
                        .end(cb);
                })
                .exec(done);
        });

        it("should return collection page with meta data", function (done) {
            flow()
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects")
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.offset).to.equal(0);
                    expect(result.body.limit).to.exist;
                    expect(result.body.count).to.equal(count + initialCount);
                    expect(result.body.results).to.exist;
                    expect(result.body.results).to.be.an.instanceof(Array);
                })
                .exec(done)
        });

        it("should return empty page when offset is out of bounce", function (done) {
            var offset = ((initialCount + count) + 1);
            flow()
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects?offset=" + offset)
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.offset).to.equal(offset);
                    expect(result.body.limit).to.exist;
                    expect(result.body.count).to.equal(count + initialCount);
                    expect(result.body.results).to.exist;
                    expect(result.body.results).to.be.an.instanceof(Array);
                    expect(result.body.results.length).to.equal(0);
                })
                .exec(done)
        });

        it("should return page in given offset and limit", function (done) {
            var maxCount = initialCount + count,
                offset = initialCount - 1,
                limit = count - 2;

            flow()
                .seq("getResult", function (cb) {
                    request(url)
                        .get("/projects?offset=" + offset + "&limit=" + limit)
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function () {
                    var result = this.vars.getResult;
                    expect(result.body).to.be.an.instanceof(Object);
                    expect(result.body.offset).to.equal(offset);
                    expect(result.body.limit).to.equal(limit);
                    expect(result.body.count).to.equal(count + initialCount);
                    expect(result.body.results).to.exist;
                    expect(result.body.results).to.be.an.instanceof(Array);
                    expect(result.body.results.length).to.equal(limit);
                })
                .exec(done);

        });

        it.skip("should return all fields that are 'includeInIndex=true'", function () {

        });

        it.skip("should return sorted collection when sort parameter is given", function () {

        });

    });

    describe("#PATCH", function () {

        it.skip("should allow 'set' on specific attribute", function () {

        });

        it.skip("should allow 'unset' on specific attribute", function () {

        });

        it.skip("should return 400 if operation is not allowed", function () {

        });

    });


});