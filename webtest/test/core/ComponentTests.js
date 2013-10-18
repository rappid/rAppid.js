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

    describe('#internal bindings', function(){
        it('attribute bindings should not be able to access external scope', function () {
            var application = window.application;
            var invalidComponent = application.$templates.invalidComponent.createInstance();

            var exception;
            try {
                application.addChild(invalidComponent);
            } catch (e) {
                exception = e;
            }
            expect(exception).to.exist;
        });

        it('function bindings should not be able to access external scope ', function(){
            var application = window.application;
            var invalidComponent = application.$templates.invalidFunctionComponent.createInstance();

            var exception;
            try {
                application.addChild(invalidComponent);
            } catch (e) {
                exception = e;
            }
            expect(exception).to.exist;
        })

    });

    describe('#attributes', function () {

        it('should be configurable from outside', function () {
            expect(window.application.$.customComponent.$.customAttribute).to.be.equal(window.application.$.foo);
            expect(window.application.$.customComponent.$.internalComponent.$.value).to.be.equal(window.application.$.foo);
        });

    });

    describe("#binding attributes", function () {

        it('should be created even it gets overwritten by injection', function () {
            var application = window.application;
            var customComponent = application.$.customComponent;


            application.set('foo', "bar2");

            expect(customComponent.$.injectableAttribute).to.be.equal("bar2");
        });

    });


});