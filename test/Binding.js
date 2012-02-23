global.inherit = require(__dirname + '/../libs/inherit.js').inherit;
var should = require('chai').should();
var requirejs = global.requirejs = require('requirejs');
var rAppid = require(__dirname + '/../src/rAppid.js').rAppid;
var underscore = require(__dirname + '/../libs/underscore-min.js');

requirejs.define("rAppid", function(){
    return rAppid;
});

requirejs.define("underscore", function() {
    return underscore;
});

var should = require('chai').should();

describe('js.core.Binding', function () {

    var Binding,
        Bindable;

    var target;
    var model;

    before(function(done){

        requirejs.config({
            baseUrl: __dirname + '/../src'
        });

        rAppid.bootStrap();

        requirejs(['js/core/Binding', 'js/core/Bindable'], function(BindingClass, BindableClass) {
            Binding = BindingClass;
            Bindable = BindableClass;

            done(null)
        });

    });

    beforeEach(function() {
        target = new Bindable({val: null});
        model = new Bindable({});
    });

    describe('#one-way-binding', function () {

        it('simple value set should set value on binded target', function() {

            var b1 = new Binding({scope: model, path: 'a', target: target, targetKey: "val"});
            model.set("a", "A");

            target.get('val').should.equal('A');

        });

    });
});