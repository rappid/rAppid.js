define(['Query'], function(Query){

    var Q = Query.inherit('js.data.Query',{
        ctor: Query,
        hasSortExpressions: function(){
            return this.query && this.query.sort && this.query.sort.length > 0;
        }
    });

    Q.query = function(){
        return new Q();
    };

    Q.Where = Query.Where;
    Q.Comparator = Query.Comparator;

    return Q;
});