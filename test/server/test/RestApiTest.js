var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    url = "http://localhost:8080/api";

describe("API", function () {

    var applicationJson = /application\/json/,
        ContentType = "Content-Type",
        LocationHeader = "Location-Header";

    describe("initial test", function () {

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

    describe("projects test", function () {

        var location;

        it("POST should create project and return location header", function (done) {

            flow()
                .seq("result", function(cb){
                    request(url)
                        .post("/projects")
                        .send({})
                        .expect(201)
                        .expect(ContentType, applicationJson)
                        .expect("Location", new RegExp(["^", url, "/","projects","/", "[0-9a-zA-Z]+", "$"].join("")))
                        .end(cb)
                })
                .seq(function(cb){
                    var result = this.vars.result;
                    request(result.header.location)
                        .get('')
                        .expect(ContentType, applicationJson)
                        .end(cb);
                })
                .exec(done);
        });


    });

    describe("/containers", function () {

//        it("GET /containers", function (done) {
//
//            flow()
//                .seq("result", function (cb) {
//                    request(url)
//                        .get("/containers")
//                        .expect(200)
//                        .expect(ContentType, applicationJson)
//                        .end(cb);
//                })
//                .seq(function () {
//                    var result = this.vars.result;
//                    expect(result.body).to.be.an.instanceof(Object);
//                    expect(result.body.count).to.be.least(0);
//                    expect(result.body.results).to.be.an.instanceof(Array);
//                    expect(result.body.results).to.have.length(result.body.count);
//                })
//                .exec(done);
//
//
//        });
//
//        it("PUT /containers/{containerName}", function (done) {
//            request(url)
//                .put("/containers/foo")
//                .expect(200)
//                .expect(ContentType, applicationJson)
//                .end(done);
//        });

    });

});