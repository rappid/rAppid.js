var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    url = "http://localhost:8080/api";

describe("API", function () {

    var applicationJson = /application\/json/,
        textHtml = /text\/html/,
        ContentType = "Content-Type",
        LocationHeader = "Location-Header";

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
            flow()
                .seq(function (cb) {
                    request(url)
                        .get("/projects/abc")
                        .expect(404)
                        .end(cb);
                })
                .seq("result", function (cb) {
                    request(url)
                        .put("/projects/abc")
                        .send({})
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                .seq(function (cb) {
                    request(url)
                        .get("/projects/abc")
                        .expect(ContentType, applicationJson)
                        .end(cb);
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
            flow()
                // create new project
                .seq(function (cb) {
                    request(url)
                        .put("/projects/awesome")
                        .send({})
                        .expect(200)
                        .expect(ContentType, applicationJson)
                        .end(cb)
                })
                // create new ticket
                .seq("result", function (cb) {
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Awesome Ticket",
                            project: {
                                name: "awesome"
                            },
                            watchers: []
                        })
                        .expect(201)
                        .expect(ContentType, applicationJson)
                        .expect("Location", new RegExp(["^", url, "/", "tickets", "/", "awesome\-[0-9]+", "$"].join("")))
                        .end(cb)
                })
                // update ticket!
                .seq(function (cb) {
                    var result = this.vars.result;
                    request(result.header.location)
                        .put('')
                        .send({
                            summary: "Super Awesome ticket",
                            project: {
                                name: "awesome"
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
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Awesome Ticket",
                            project: {
                                name: "awesome"
                            },
                            watchers: []
                        })
                        .expect(201)
                        .expect(ContentType, applicationJson)
                        .expect("Location", new RegExp(["^", url, "/", "tickets", "/", "awesome\-[0-9]+", "$"].join("")))
                        .end(cb)
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

        var location;

        before(function (cb) {
            request(url)
                .put("/projects/test")
                .send({})
                .expect(200)
                .expect(ContentType, applicationJson)
                .end(cb);
        });


        it("should create new resource and return location header", function (done) {

            flow()
                .seq("result", function (cb) {
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Test Ticket",
                            project: {
                                name: "test"
                            },
                            watchers: []
                        })
                        .expect(201)
                        .expect(ContentType, applicationJson)
                        .expect("Location", new RegExp(["^", url, "/", "tickets", "/", "test\-[0-9]+", "$"].join("")))
                        .end(cb)
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

        it('should create resources with unique ids', function (done) {
            var tickets = new Array(10);

            flow()
                .parEach(tickets, function (item, cb) {
                    request(url)
                        .post("/tickets")
                        .send({
                            summary: "Test Ticket",
                            project: {
                                name: "test"
                            },
                            watchers: []
                        })
                        .expect(201)
                        .expect(ContentType, applicationJson)
                        .expect("Location", new RegExp(["^", url, "/", "tickets", "/", "test\-[0-9]+", "$"].join("")))
                        .end(cb)
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

    describe("#DELETE", function(){

        it.skip("should delete resource if exists", function(){

        });

        it.skip("should return 404 if resource wasn't found", function(){

        });

    });

    describe("#GET", function(){

        it.skip("should return 404 if resource does not exist", function(){

        });

        it.skip("should return data for existing resource", function(){

        });

        it.skip("should return collection page with meta data", function(){

        });

    });

    describe("#PATCH", function(){

        it.skip("should allow 'set' on specific attribute", function(){

        });

        it.skip("should allow 'unset' on specific attribute", function(){

        });

        it.skip("should return 400 if operation is not allowed", function(){

        });

    });


});