var should = require('chai').should();
var requirejs = require('./../lib/TestRunner').require;

var Binding = requirejs("js/core/Binding"),
    Bindable = requirejs("js/core/Bindable"),
    Parser = requirejs('js/core/BindingParser');

describe('js.core.Binding', function () {

    var target;
    var model;
    var PATH_RULE = "path";
    var returnValue = "HALLO";
    var parStr = "abc";
    var parNum = 123;
    var extendedModel;
    var ExtendedClass = Bindable.inherit('ExtendedClass', {
        foo: function () {
            return returnValue;
        },
        bar: function(par1,par2){
            return par1 === parStr && par2 === parNum;
        },
        // MOCK FUNCTION
        getScopeForFncName: function(name){
            if(this[name]){
                return this;
            }
            return null;
        },
        // MOCK FUNCTION
        getScopeForKey: function(name){
            if(this.$[name]){
                return this;
            }
            return null;
        }
    });

    beforeEach(function () {
        target = new Bindable({val: null});
        model = new Bindable({});

        extendedModel = new ExtendedClass({});
    });

    describe('#one-way-binding', function () {

        it('simple value set should set value on binded target', function () {

            var b1 = new Binding({scope: model, path: Parser.parse('a', PATH_RULE), target: target, targetKey: "val"});
            model.set("a", "A");

            target.get('val').should.equal('A');

        });

        it('path binding a.b should return null if b is not set', function () {
            var b1 = new Binding({scope: model, path: Parser.parse('a.b', PATH_RULE), target: target, targetKey: "val"});

            model.set("a", "A");
            should.equal(target.get('val'), null);

            var m1 = new Bindable({b: "B"});
            model.set("a", m1);
            target.get('val').should.equal('B');

            m1.set("b", "B2");
            target.get("val").should.equal('B2');

            var m2 = new Bindable({b: "AWESOME"});
            model.set("a", m2);
            target.get("val").should.equal("AWESOME");

            model.set('a', null);
            should.equal(target.get('val'), null);
        });

        it('path binding a.b.c should return null if b or c is not set', function () {
            var b1 = new Binding({scope: model, path: Parser.parse('a.b.c', PATH_RULE), target: target, targetKey: "val"});

            model.set("a", "A");
            should.equal(target.get('val'), null);

            var m1 = new Bindable({b: "B"});
            model.set("a", m1);
            should.equal(target.get("val"), null);

            var m2 = new Bindable({c: "WHAT UP"});
            m1.set('b', m2);
            target.get("val").should.equal('WHAT UP');

            var m3 = new Bindable({b: "AWESOME"});
            model.set("a", m3);
            should.equal(target.get("val"), null);
        });

    });

    describe('#two way binding', function(){
        it('should set value on scope', function () {
            new Binding({scope: model, path: Parser.parse('a', PATH_RULE), target: target, targetKey: "val", twoWay: true});

            model.set("a", "A");
            model.get('a').should.equal("A");
            target.set({val: 'TargetValue'});

            model.get("a").should.equal("TargetValue");
        });

        it('should set value if b in a.b is set', function () {
            var binding = new Binding({scope: model, path: Parser.parse('a.b', PATH_RULE), target: target, targetKey: "val", twoWay: true});

            target.set({val: 'TargetValue'});
            should.equal(binding.getValue(), null);

            var m1 = new Bindable({b: "hello"});
            model.set("a", m1);

            target.set({val: 'TargetValue'});
            m1.get('b').should.equal("TargetValue");
        });
    });


    describe('#function binding', function () {

        it('foo() should call fnc and set returned value to target', function () {
            new Binding({scope: extendedModel, path: Parser.parse("foo()", PATH_RULE), target: target, targetKey: 'val'});
            target.get('val').should.equal(returnValue);
        });

        it('a.foo() should be triggered if "a" is set and has fnc', function(){
            new Binding({scope: model, path: Parser.parse('a.foo()', PATH_RULE), target: target, targetKey: 'val'});
            should.not.exist(target.get('val'));

            var m1 = new Bindable({b: "what"});
            model.set('a', m1);

            should.not.exist(target.get('val'));

            model.set('a',extendedModel);

            target.get('val').should.equal(returnValue);
        });

        var fncBinding = "bar('" + parStr + "'," + parNum + ")";
        it(fncBinding + " should call bar with parameters and return true", function () {
            new Binding({scope: extendedModel, path: Parser.parse(fncBinding, PATH_RULE), target: target, targetKey: 'val'});
            target.get('val').should.equal(true);
        });

        var fncBinding2 = "bar({m1.a},{m1.b})";
        it(fncBinding2 + ' should be triggered if m1.a or m1.b is changing', function () {
            var extendedTarget = new ExtendedClass();
            // extendedTarget.set('m1', new ExtendedClass({}));
            extendedModel.set('m1',extendedTarget);
            new Binding({scope: extendedModel, path: Parser.parse(fncBinding2, PATH_RULE), target: extendedTarget, targetKey: 'val'});
            extendedTarget.get('val').should.equal(false);

            extendedTarget.set({'a':parStr, 'b': parNum});
            extendedTarget.get('val').should.equal(true);

            extendedModel.set('m1', new ExtendedClass({
                a: 'a',
                b: 'b'
            }));
            extendedTarget.get('val').should.equal(false);
        });

    })
});