var should = require('chai').should();
var requirejs = require('./TestRunner').require;

var List = requirejs("js/core/List");

describe('js.core.List', function () {

    describe('#instanceof check', function () {

        it ('Create an instance and check with instance of', function() {

            var l = new List();
            (l instanceof List).should.be.ok;

        });
    })
});
