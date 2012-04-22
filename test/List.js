global.inherit = require(__dirname + '/../js/lib/inherit.js').inherit;
global.flow = require(__dirname + '/../js/lib/flow.js').flow;
var should = require('chai').should();
var underscore = global.underscore = require(__dirname + '/../js/lib/underscore-min.js')._;

var rAppid = require(__dirname + '/../js/lib/rAppid.js').rAppid;

describe('js.core.List', function () {

    var List;

    var list, items, item;

    before(function (done) {

        requirejs.config({
            baseUrl:__dirname + '/../src'
        });

        rAppid.bootStrap();

        requirejs(['js/core/List'], function (ListClass) {
            List = ListClass;

            done(null)
        });

    });

    beforeEach(function () {
        list = new List([]);
        items = ['item1', 'item2', 'item3'];
        item = "item";
    });

    describe('add', function () {

        it('should add one item to list', function () {
            list.size().should.equal(0);
            list.add(item);
            list.size().should.equal(1);
        });

        it('should add a array of items', function() {
            list.size().should.equal(0);
            list.add(items);
            list.size().should.equal(3);
        });

        it('should add one item to index 0', function() {
            list.add(items);
            list.add(item,0);
            list.at(0).should.equal(item);
        });

        it('should add one item to a specific index', function () {
            list.add(items);
            list.add(item, 1);
            list.at(1).should.equal(item);
        });

        it('should add items to a specific index', function () {
            var index = 1;
            var newItems = ["a", "b", "c"];
            list.add(items);
            list.add(newItems, index);
            for (var i = 0; i < items.length; i++) {
                list.at(index + i).should.equal(newItems[i]);
            }
        });

    });

    describe('remove', function () {
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

    });

    describe('removeAt', function () {
        it('should remove one item at a specific index', function () {
            var index = 1;
            list.add(items);
            list.add(item,index);
            list.removeAt(index);
            list.each(function(citem){
                should.not.equal(citem,item);
            });
        });
    });

    describe('sort', function () {
        it('should sort the list', function () {
            // TODO:
        });
    });

    describe('on remove', function () {
        it('should trigger on removing one item', function () {
            // TODO:
        });
    });

    describe('on add', function () {
        it('should trigger on add one item', function () {
            // TODO:
        });
    });

    describe('on add', function () {
        it('should trigger on adding an array of items', function () {
            // TODO:
        });
    });






});