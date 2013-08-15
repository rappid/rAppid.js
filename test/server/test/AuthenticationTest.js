var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    url = "http://localhost:8080/api";


describe('#USER REGISTRATION AND LOGIN', function () {

    it("should register a new user by email", function (done) {
        var email = "krebbl@gmail.com";
        request(url)
            .post("/register")
            .send({
                email: email,
                password: "secret"
            })
            .expect(201)
            .expect("Location", new RegExp(["^", url, "/", "users", "/", "[0-9a-zA-Z-]+", "$"].join("")))
            .end(done);
    });

    it("should return 400 if username already exists", function (done) {
        var email = "krebbl@gmail.com";
        request(url)
            .post("/register")
            .send({
                email: email,
                password: "secret"
            })
            .expect(400)
            .end(done);
    });

    it('should authenticate user against DataSourceAuthenticationProvider', function (done) {
        request(url)
            .post("/authentications")
            .send({
                provider: "dataSource",
                email: "krebbl@gmail.com",
                password: "secret"
            })
            .expect(201)
            .expect("Location", new RegExp(["^", url, "/", "authentications", "/", "[0-9a-zA-Z-]+", "$"].join("")))
            .end(done);
    });

    it('should not authenticate user with wrong password', function (done) {
        request(url)
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
        request(url)
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
                request(url)
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
                request(url)
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
        request(url)
            .post("/authentications")
            .send({
                someToken: "abcbc"
            })
            .expect(201)
    });


});
