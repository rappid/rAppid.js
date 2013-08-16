var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    host = "localhost:8080",
    url = "http://" + host,
    apiUrl = url + "/api";

describe('Authentication & Authorization', function () {

    describe('#USER REGISTRATION AND LOGIN', function () {

        it("should register a new user by email", function (done) {
            var email = "krebbl@gmail.com";
            request(apiUrl)
                .post("/register")
                .send({
                    email: email,
                    password: "secret"
                })
                .expect(201)
                .expect("Location", new RegExp(["^", apiUrl, "/", "users", "/", "[0-9a-zA-Z-]+", "$"].join("")))
                .end(done);
        });

        it("should return 400 if username already exists", function (done) {
            var email = "krebbl@gmail.com";
            request(apiUrl)
                .post("/register")
                .send({
                    email: email,
                    password: "secret"
                })
                .expect(400)
                .end(done);
        });

        it('should authenticate user against DataSourceAuthenticationProvider', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    email: "krebbl@gmail.com",
                    password: "secret"
                })
                .expect(201)
                .expect("Location", new RegExp(["^", apiUrl, "/", "authentications", "/", "[0-9a-zA-Z-]+", "$"].join("")))
                .end(done);
        });

        it('should not authenticate user with wrong password', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    email: "krebbl@gmail.com",
                    password: "wrongsecret"
                })
                .expect(401)
                .end(done);

        });

        it('should return 401 if credentials are not set correctly', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    em: "krebbl@gmail.com",
                    foo: "wrongsecret"
                })
                .expect(401)
                .end(done);
        });

        it('should block user after too many wrong login attempts', function (done) {
            var attempts = [1, 2];

            flow()
                .seqEach(attempts, function (attempt, cb) {
                    request(apiUrl)
                        .post("/authentications")
                        .send({
                            provider: "dataSource",
                            email: "krebbl@gmail.com",
                            password: "wrongsecret"
                        })
                        .expect(401)
                        .end(cb);

                })
                .exec(function () {
                    request(apiUrl)
                        .post("/authentications")
                        .send({
                            provider: "dataSource",
                            email: "krebbl@gmail.com",
                            password: "wrongsecret"
                        })
                        .expect(400)
                        .end(done);
                });

        });

        it.skip('should login and create user with external authentication token', function () {
            request(apiUrl)
                .post("/authentications")
                .send({
                    someToken: "abcbc"
                })
                .expect(201)
        });


    });

    describe('#AUTHORIZATION', function () {

        it("should return 403 if user not authorized", function(done) {

            request(url)
                .get("/foo.txt")
                .expect(403)
                .end(done);
        });

        it("should return 200 if user is authorized", function (done) {

            request(url)
                .get("/foo.txt?guruMoDe=god")
                .expect(200)
                .end(done);
        });


    });
});

