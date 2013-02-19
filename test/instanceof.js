var expect = require('chai').expect;
var testRunner = require('..').TestRunner.setup();

describe('instanceof', function () {

    var C = {};

    before(function (done) {
        testRunner.requireClasses({
            Base: 'js/core/Base',
            List: 'js/core/List'
        }, C, done);
    });

    describe('#instanceof check', function () {

        it ('Create an instance and check with instance of', function() {

            var l = new C.List();
            expect(l).to.be.instanceof(C.List);

        });

        it('Check if class inherits from class without instance creation', function () {
            expect(C.List.prototype).to.be.instanceof(C.Base);
        });
    });


});
