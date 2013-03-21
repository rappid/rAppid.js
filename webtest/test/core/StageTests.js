describe("Stage tests", function () {

    var stageSelector = "body > .stage";

    it("Stage should be rendered to target dom node", function () {
        $expect(stageSelector).to.exist();
        expect($(stageSelector).get(0)).to.eql(window.stage.$el);
    });

    it("Stage should export external interface methods", function() {
        var stage = $("body > .stage").get(0);
        expect(stage.test).to.exist;

        var value = Math.random();
        // call external api function
        stage.test(value);

        // and check that the function was called, by checking the testValue on the window object
        expect(window.stage.testValue).to.eql(value);
    });

    it("Stage should have touch or no-touch as class", function() {

        if ("ontouchstart" in window) {
            $expect(stageSelector).to.have.class("touch");
        } else {
            $expect(stageSelector).to.have.class("no-touch");
        }

    });

    it ("Stage should have a window manager and one window", function() {
        $expect(stageSelector)
            .to.have.children(".window-manager")
                .that.have.children(".window")
                    .that.have.children("h1")
                        .that.have.text("StageTest")
    });

});