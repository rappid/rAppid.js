var should = require('chai').should();
var requirejs = require('./../lib/TestRunner').require;

var PagedView = requirejs("js/data/PagedView"),
    Collection = requirejs("js/data/Collection");

var CollectionMock = Collection.inherit({

    ctor: function (pageSize, fetchPageCallback) {
        this.callBase(null, {
            pageSize: pageSize
        });

        this.fetchPageCallback = fetchPageCallback;
    },

    fetchPage: function (pageIndex, options, callback) {
        this.fetchPageCallback(pageIndex);
    }
});


describe('js.data.PagedView', function () {

    describe('#page Translation', function () {

        function testPageTranslation(done, collectionPageSize, pageSize, navigateToPage, toBeFetched) {
            var c = new CollectionMock(collectionPageSize, function (page) {

                if (toBeFetched.indexOf(page) !== -1) {
                    toBeFetched.splice(toBeFetched.indexOf(page), 1);
                }

                if (toBeFetched.length === 0) {
                    done();
                }

            });
            var pw = new PagedView(c, {
                pageSize: pageSize
            });

            pw.set({
                page: navigateToPage
            })
        }

        it('Should fetch page 1', function (done) {
            testPageTranslation(done, 5, 3, 2, [1])
        });

        it('Should fetch page 2', function (done) {
            testPageTranslation(done, 5, 2, 5, [2]);
        });

        it('Should fetch page 0 and 1', function (done) {
            testPageTranslation(done, 5, 3, 1, [0, 1]);
        });

        it('Should fetch many pages', function (done) {
            testPageTranslation(done, 1, 5, 1, [5, 6, 7, 8, 9]);
        });


        it('Be on the same page should not call fetchPage', function (done) {

            var called = 0;

            var c = new CollectionMock(100, function (page) {
                called++;

                if (called > 1) {
                    throw "collection fetch called to often";
                }
            });

            var pw =  new PagedView(c);
            pw.set({
                page: 2
            });

            pw.set({
                page: 2
            });

            setTimeout(function(){
                done();
            }, 10);
      });
    });


});