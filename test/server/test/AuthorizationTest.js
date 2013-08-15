var request = require("supertest"),
    expect = require("chai").expect,
    flow = require("flow.js").flow,
    url = "http://localhost:8080/api";


describe('#Authorization', function () {

    it.skip("should register a new user by email", function (done) {
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

});
