describe("Component tests", function () {

    var stageSelector = "body > .stage";

    it("Stage should be rendered to target dom node", function () {
        $expect(stageSelector).to.exist();
        expect($(stageSelector).get(0)).to.eql(window.stage.$el);
    });

    describe("#internal attributes", function () {

        it("should not be overridden from outside", function () {

            expect(window.application.$.name).to.be.equal("application");
            expect(window.application.$.customComponent.$.name).to.be.equal("customComponent");
            expect(window.application.$.customComponent.$.internalComponent.$.internalName).to.be.equal(window.application.$.customComponent.$.name);

        });

    });

    describe('#attributes', function(){

        it('should be configurable from outside', function(){
            expect(window.application.$.customComponent.$.customAttribute).to.be.equal(window.application.$.foo);
            expect(window.application.$.customComponent.$.internalComponent.$.value).to.be.equal(window.application.$.foo);
        });

    });

});