var should = require('chai').should();
var requirejs = require('./../lib/TestRunner').require;

var List = requirejs("js/core/List");

describe('js.core.List', function () {

    describe('#instanceof check', function () {

        it ('Create an instance and check with instance of', function() {

            var l = new List();
            (l instanceof List).should.be.ok;

        });

        it('Check if class inherits from class without instance creation', function () {

            var Base = requirejs('js/core/Base'),
                Router = requirejs('js/core/Router');

            (Router.prototype instanceof Base).should.be.ok;

        });
    });


});
