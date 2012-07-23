var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup();

var C = {};


describe('js.core.List', function () {

    var List;

    var list, items, item, bindable;

    before(function (done) {
        testRunner.requireClasses({
            List: 'js/core/List',
            Bindable: 'js/core/Bindable'
        }, C, done);
    });

    beforeEach(function () {
        list = new C.List([]);
        items = ['item1', 'item2', 'item3'];
        item = "item";
        bindable = new C.Bindable({
            firstname: 'Max',
            lastname: 'Mustermann'
        });
    });

    describe('#size', function(){
        it('should return size of list', function(){
            list.size().should.equal(0);
            list.add(item);
            list.size().should.equal(1);
        });
    });

    describe('#add', function () {

        it('should add a array of items', function() {
            list.size().should.equal(0);
            list.add(items);
            list.size().should.equal(items.length);
        });

        it('should add one item to index 0', function() {
            list.add(items);
            list.add(item,{index: 0});
            list.at(0).should.equal(item);
        });

        it('should add one item to a specific index', function () {
            list.add(items);
            list.add(item, {index: 1});
            list.at(1).should.equal(item);
        });

        it('should add array of items to a specific index', function () {
            var index = 1;
            var newItems = ["a", "b", "c"];
            list.add(items);
            list.add(newItems, {index: index});
            for (var i = 0; i < items.length; i++) {
                list.at(index + i).should.equal(newItems[i]);
            }
        });

    });

    describe('#remove', function () {
        it('should remove one item', function(){
            list.add(item);
            list.size().should.equal(1);
            list.remove(item);
            list.size().should.equal(0);
        });

        it('should remove a bunch of items', function () {
            list.add(item);
            list.add(items);
            list.size().should.equal(1+items.length);
            list.remove(items);
            list.size().should.equal(1);
        });

        it('should trigger a remove event with the removed item', function(){
            list.bind('remove', function(e){
                expect(e.$.item).to.be.equal(item);
            });
            list.add(item);
            list.add(items);
            list.remove(item);
        });

        it('should trigger a remove event for each element', function (done) {
            var toRemove = items.length;
            list.bind('remove', function (e) {
                toRemove--;
                if(toRemove === 0){
                    done();
                }
            });
            list.add(items);
            list.add(item);
            list.remove(items);
        });
    });

    describe('#removeAt', function () {
        it('should remove one item at a specific index', function () {
            var index = 1;
            list.add(items);
            list.add(item,{index: index});
            list.removeAt(index);
            list.each(function(citem){
                should.not.equal(citem,item);
            });
        });
    });

    describe('#sort', function () {
        it('should sort the list', function () {
            list.add(items);
            list.sort(function(item,item2){
               return parseInt(item) < parseInt(item2) ? -1 : 1;
            });
            list.each(function(citem, i){
                expect(items[items.length-1-i]).to.be.equal(citem);
            });
        });

        it('should trigger the sort event', function(){
            list.bind('sort', function(){
                list.each(function (citem, i) {
                    expect(items[items.length - 1 - i]).to.be.equal(citem);
                });
            });
            list.add(items);
            list.sort(function (item, item2) {
                return parseInt(item) < parseInt(item2) ? -1 : 1;
            });
        });

        it('should trigger the sort event with sorted items', function () {
            list.bind('sort', function (e) {
                var citem;
                for(var i = 0; i < e.$.items.length; i++){
                    citem = e.$.items[i];
                    expect(items[items.length - 1 - i]).to.be.equal(citem);
                }
            });
            list.add(items);
            list.sort(function (item, item2) {
                return parseInt(item) < parseInt(item2) ? -1 : 1;
            });
        });
    });

    describe('#change of item attributes', function () {
        it('should trigger change event', function () {
            list.bind('change', function(e){
                expect(e.$.item).to.equal(bindable);
            });
            list.add(bindable);
            bindable.set('firstname','Peter');
        });
    });

    describe('#sync', function(){
        var b1, b2, b3, copy;
        beforeEach(function () {
            b1 = new C.Bindable({
                firstname: 'Max',
                lastname: 'Mustermann'
            });
            b2 = new C.Bindable({
                street: 'Street 1',
                city: 'City 1'
            });
            b3 = new C.Bindable({
                foo: 'xyz',
                bar: 'uvw'
            });
            list = new C.List([b1,b2,b3]);
            copy = list.clone();
        });

        it('should have same items after remove', function(){
            copy.removeAt(0);

            copy.sync();

            expect(list.length).to.be.equal(copy.length);
        });

        it('should have all new items of copy', function(){
            copy.add(new C.Bindable({
                a: "a",
                b: "b"
            }));

            copy.sync();

            expect(list.length).to.be.equal(copy.length);
            expect(list.at(list.length-1)).to.be.equal(copy.at(list.length-1));
        });

        it('should not replace modified items', function() {
            copy.at(0).set({firstName: 'Peter', lastName: 'Pan'});

            copy.sync();

            expect(list.at(0)).not.to.be.equal(copy.at(0));
            expect(list.at(0).$.firstName).to.be.equal(copy.at(0).$.firstName);
            expect(list.at(0).$.lastName).to.be.equal(copy.at(0).$.lastName);
        });
    });





});