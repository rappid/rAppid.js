define(['Query', 'js/core/Bindable'], function(Query, Bindable){

    var Q = Query.inherit('js.data.Query',{
        ctor: Query
    });

    Q.query = function(){
        return new Q();
    };

    Q.Where = Query.Where;
    Q.Comparator = Query.Comparator;

    return Q;
});