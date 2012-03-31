global.inherit = require(__dirname + '/../lib/inherit.js').inherit;
global.flow = require(__dirname + '/../lib/flow.js').flow;
var should = require('chai').should();
var requirejs = global.requirejs = require('requirejs');
var underscore = global.underscore = require(__dirname + '/../lib/underscore-min.js')._;

var rAppid = require(__dirname + '/../src/rAppid.js').rAppid;

requirejs.define("rAppid", function(){
    return rAppid;
});

requirejs.define("underscore", function() {
    return underscore;
});

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

        it('path binding a.b should return null if b is not set', function(){
            var b1 = new Binding({scope:model, path:'a.b', target:target, targetKey:"val"});

            model.set("a", "A");
            should.equal(target.get('val'),null);

            var m1 = new Bindable({b:"B"});
            model.set("a", m1);
            target.get('val').should.equal('B');

            m1.set("b", "B2");
            target.get("val").should.equal('B2');

            var m2 = new Bindable({b:"AWESOME"});
            model.set("a", m2);
            target.get("val").should.equal("AWESOME");

            model.set('a',null);
            should.equal(target.get('val'), null);
        });

        it('path binding a.b.c should return null if b or c is not set', function(){
            var b1 = new Binding({scope:model, path:'a.b.c', target:target, targetKey:"val"});

            model.set("a", "A");
            should.equal(target.get('val'),null);

            var m1 = new Bindable({b:"B"});
            model.set("a", m1);
            should.equal(target.get("val"),null);

            var m2 = new Bindable({c:"WHAT UP"});
            m1.set('b', m2);
            target.get("val").should.equal('WHAT UP');

            var m3 = new Bindable({b:"AWESOME"});
            model.set("a", m3);
            should.equal(target.get("val"),null);
        });

        it('simple two way binding should set value on scope', function(){
            new Binding({scope:model, path:'a', target:target, targetKey:"val", twoWay:true});

            model.set("a", "A");
            model.get('a').should.equal("A");
            target.set({val:'TargetValue'});
            model.get("a").should.equal("TargetValue");
        });

        it('two way path binding a.b should set value if b is set', function () {
            var binding = new Binding({scope:model, path:'a.b', target:target, targetKey:"val", twoWay:true});

            target.set({val:'TargetValue'});
            should.equal(binding.getValue(),null);

            var m1 = new Bindable({b: "hello"});
            model.set("a",m1);

            target.set({val:'TargetValue'});
            m1.get('b').should.equal("TargetValue");
        });

    });
});