define(['js/core/Base'], function(Base){

    return Base.inherit('js.data.QueryMapper',{


        parse: function(queryString){
            // abstract method
        },

        compose: function(query){
            return query.toObject();
        }
    });

});