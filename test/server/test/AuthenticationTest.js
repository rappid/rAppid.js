var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    host = "localhost:8080",
    url = "http://" + host,
    apiUrl = url + "/api";

describe('Registration, Authentication & Authorization', function () {

    var email = "foo@bar.com";

    describe('#Registration', function () {

        it("should register a new user by email", function (done) {
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
            request(apiUrl)
                .post("/register")
                .send({
                    email: email,
                    password: "secret"
                })
                .expect(400)
                .end(done);
        });

    });

    describe('#Authentication', function () {

        var token;

        it('should authenticate user against DataSourceAuthenticationProvider', function (done) {
            flow()
                .seq("result", function (cb) {
                    request(apiUrl)
                        .post("/authentications")
                        .send({
                            provider: "dataSource",
                            email: email,
                            password: "secret"
                        })
                        .expect(201)
                        .expect("Location", new RegExp(["^", apiUrl, "/", "authentications", "/", "[0-9a-zA-Z-]+", "$"].join("")))
                        .end(cb);
                })
                .seq(function (cb) {
                    token = this.vars.result.body.token;
                    cb();
                })
                .exec(done);
        });

        it('should logout user', function (done) {
            request(apiUrl)
                .del("/authentications/" + token)
                .send()
                .expect(200)
                .end(done);
        });

        it('should not authenticate user with wrong password', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    email: email,
                    password: "wrongsecret"
                })
                .expect(401)
                .end(done);

        });

        it('should not authenticate user with wrong email', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    email: "mr@wrong.de",
                    password: "secret"
                })
                .expect(401)
                .end(done);

        });

        it('should return 401 if credentials are not set correctly', function (done) {
            request(apiUrl)
                .post("/authentications")
                .send({
                    provider: "dataSource",
                    em: email,
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
                            email: email,
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
                            email: email,
                            password: "wrongsecret"
                        })
                        .expect(401)
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

    describe('#Authorization', function () {

        it("should return 403 if user not authorized", function (done) {

            request(url)
                .get("/foo.txt")
                .expect(403)
                .end(done);
        });

        it("should return 200 if user is authorized", function (done) {

            request(url)
                .get("/foo.txt")
                .query({ guruMoDe: 'god' })
                .set('Accept', 'text/plain')
                .expect(200)
                .end(done);
        });

        it('should authorize user with auth token', function (done) {

            var username = "user@system.de",
                password = "auth";

            flow()
                // register user
                .seq("registration", function (cb) {
                    request(apiUrl)
                        .post("/register")
                        .send({
                            email: username,
                            password: password
                        })
                        .expect(201)
                        .end(cb);
                })
                // login
                .seq("result", function (cb) {
                    request(apiUrl)
                        .post("/authentications")
                        .send({
                            provider: "dataSource",
                            email: username,
                            password: password
                        })
                        .expect(201)
                        .end(cb);

                })
                // access
                .seq(function (cb) {
                    var result = this.vars.result,
                        token = result.body.token;
                    request(url)
                        .get("/foo.txt")
                        .query({ token: token })
                        .set('Accept', 'text/plain')
                        .expect(200)
                        .end(cb);

                })
                .exec(done);

        });


    });
});

