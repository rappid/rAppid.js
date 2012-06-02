var should = require('chai').should();
var testRunner = require('..').TestRunner.setup();

describe('js.core.List', function () {

    describe('#instanceof check', function () {

        it ('Create an instance and check with instance of', function(done) {

            testRunner.require(['js/core/List'], function(List) {
                var l = new List();
                (l instanceof List).should.be.ok;
                done();
            });


        });

        it('Check if class inherits from class without instance creation', function (done) {

            testRunner.require(['js/core/Base', 'js/core/Router'], function(Base, Router) {
                (Router.prototype instanceof Base).should.be.ok;
                done();
            });

        });
    });


});
