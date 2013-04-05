var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup();

var C = {};


describe('js.data.QueryList', function () {

    var List;

    var list, items, item, bindable;

    before(function (done) {
        testRunner.requireClasses({
            List: 'js/core/List',
            QueryList: 'js/data/QueryList',
            Bindable: 'js/core/Bindable',
            Query: 'js/data/Query'
        }, C, done);
    });

    describe('#ctor without query', function(){
        it('should not filter items', function(){
            var list = new C.List(["a", "b", "c"]);
            var queryList = new C.QueryList({
               list: list
            });

            expect(queryList.size()).to.be.equal(list.size());
        });
    });

    describe("#ctor with query", function(){
        it('should filter items', function(){
            var list = new C.List([{
                name: "Adam"
            },{
                name: "Bob"
            },{
                name: "Charlie"
            }]);
            var query = new C.Query();
            query.eql("name","Adam");

            var queryList = new C.QueryList({query: query, list: list});
            expect(queryList.size()).to.be.equal(1);
        });
    });

    describe('#on list add', function () {
        it('should apply filter to added item', function () {
            var list = new C.List([
                {
                    name: "Adam"
                },
                {
                    name: "Bob"
                },
                {
                    name: "Charlie"
                }
            ]);
            var query = new C.Query();
            query.eql("name", "Adam");

            var queryList = new C.QueryList({query: query, list: list});
            expect(queryList.size()).to.be.equal(1);

            // add item which matches filter
            list.add({
                name: "Adam"
            });
            expect(queryList.size()).to.be.equal(2);

            // add item which doesn't match filter
            list.add({
                name: "Don"
            });
            expect(queryList.size()).to.be.equal(2);
        });


    });

    describe('#on query change', function(){

        it('should reset list', function(){
            var list = new C.List([
                {
                    name: "Adam"
                },
                {
                    name: "Bob"
                },
                {
                    name: "Charlie"
                }
            ]);
            var query = new C.Query();
            query.eql("name", "Adam");

            var queryList = new C.QueryList({ list: list});
            expect(queryList.size()).to.be.equal(list.size());

            queryList.set('query', query);

            expect(queryList.size()).to.be.equal(1);

            queryList.set('query', (new C.Query()).eql("name","Peter"));

            expect(queryList.size()).to.be.equal(0);
        });

    });

    describe('#on list remove', function () {
        it('should remove item from query list', function(){
            var list = new C.List([
                {
                    name: "Adam"
                },
                {
                    name: "Bob"
                },
                {
                    name: "Charlie"
                }
            ]);
            var query = new C.Query();
            query.eql("name", "Adam");

            var queryList = new C.QueryList({query: query, list: list});
            expect(queryList.size()).to.be.equal(1);

            list.removeAt(1);

            expect(queryList.size()).to.be.equal(1);

            list.removeAt(0);
            expect(queryList.size()).to.be.equal(0);
        });
    });

    describe('#on list reset', function(){

        it('should reset query list', function(){
            var list = new C.List();
            var query = new C.Query();
            query.eql("name", "Adam");

            var queryList = new C.QueryList({query: query, list: list});
            expect(queryList.size()).to.be.equal(0);

            list.reset([
                {
                    name: "Adam"
                },
                {
                    name: "Bob"
                },
                {
                    name: "Charlie"
                }
            ]);
            expect(queryList.size()).to.be.equal(1);

            list.reset();
            expect(queryList.size()).to.be.equal(0);
        })
    });

    describe('#query with sort', function () {

        var list,
            query,
            queryList;

        beforeEach(function(){
            list = new C.List([
                new C.Bindable({
                    name: "Charlie"
                }),
                new C.Bindable({
                    name: "Adam"
                }),
                new C.Bindable({
                    name: "Bob"
                })
            ]);
            query = new C.Query();
            query.sort("+name");
            queryList = new C.QueryList({query: query, list: list});
        });

        it('should create list with sorted order', function(){
            expect(queryList.size()).to.be.equal(list.size());

            expect(queryList.at(0).get('name')).to.be.equal("Adam");
            expect(queryList.at(1).get('name')).to.be.equal("Bob");
            expect(queryList.at(2).get('name')).to.be.equal("Charlie");
        });

        it('should add item on correct position', function(){
            list.add(new C.Bindable({name: 'Barney'}));
            expect(queryList.size()).to.be.equal(4);
            expect(queryList.at(1).get('name')).to.be.equal("Barney");
            expect(queryList.at(2).get('name')).to.be.equal("Bob");
        });

        it('should resort item on item change', function(){
            queryList.at(1).set('name','Edward');
            expect(queryList.size()).to.be.equal(list.size());
            expect(queryList.at(1).get('name')).to.be.equal("Charlie");
            expect(queryList.at(2).get('name')).to.be.equal("Edward");
            list.add(new C.Bindable({name: "Dave"}));

            expect(queryList.at(2).get('name')).to.be.equal("Dave");
            expect(queryList.at(3).get('name')).to.be.equal("Edward");
        });

    });

});