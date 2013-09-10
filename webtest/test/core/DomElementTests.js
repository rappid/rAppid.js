describe("DomElement tests", function () {

    var stageSelector = "body > .stage";

    it("Stage should be rendered to target dom node", function () {
        $expect(stageSelector).to.exist();
        expect($(stageSelector).get(0)).to.eql(window.stage.$el);
    });

    describe("#visible", function () {

        it("should remove element from DOM in the right order", function () {

            window.application.$.firstDiv.set('visible', false);
            window.application.$.secondDiv.set('visible',true);
            window.application.$.firstDiv.set('visible', true);

            $expect($("#divContainer").find("div").eq(0)).to.be("#firstDiv");
            $expect($("#divContainer").find("div").eq(1)).to.be("#secondDiv");

            window.application.$.secondDiv.set('visible', false);
            window.application.$.secondDiv.set('visible', true);

            $expect($("#divContainer").find("div").eq(0)).to.be("#firstDiv");
            $expect($("#divContainer").find("div").eq(1)).to.be("#secondDiv");

        });

    });

});