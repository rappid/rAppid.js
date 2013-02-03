describe("#SelectTests", function () {

    describe("#bound items", function () {

        it("should render all items with the given template", function (done) {

            flow()
                .seq("bound", function(cb) {
                    browser.elementById("bound", cb);
                })
                .seq("options", function(cb) {
                    var bound = this.vars.bound;
                    expect(bound).to.exist;

                    bound.elementsByCss("*", cb)
                })
                .seq(function() {
                    var options = this.vars.options;
                    expect(options.length).to.eql(2);
                    expect(options[0].value).to.eql("1");
                    expect(options[1].value).to.eql("2");
                })
                .exec(done);

        });

        it("should skip", function() {
            throw new SkipError();
        })

    });
});