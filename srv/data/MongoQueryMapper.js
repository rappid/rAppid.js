define(["js/data/QueryMapper","underscore"], function(QueryMapper, _){


    var RQLtoMongoMap = {
        "lt" : "$lt",
        "le" : "$lte",
        "gt" : "$gt",
        "ge" : "$gte",
        "in" : "$in",
        "ne" : "$ne",
        "not" : "$not",
        "all" : "$all",
        "regex" : "$regex"
    };


    return QueryMapper.inherit("srv.data.MongoQueryMapper",{
        compose: function(query) {
            var hash = query.toObject(),
                ret = {};

            if(hash.sort){
                ret.sort = null;
            }

            if(hash.where){
                ret.where = this.translateOperator(hash.where);
            }

            return ret;
        },

        translateOperator: function(operator){
            var name = operator.operator,
                ret = {},
                field;
            if (name === "and" || name === "or") {
                ret["$"+name] = this.translateExpressions(operator.expressions);
            } else if(name === "eql"){
                field = operator.field;
                ret[field] = operator.value;
            } else if(RQLtoMongoMap.hasOwnProperty(name)){
                field = operator.field;

                ret[field] = {};
                ret[field][RQLtoMongoMap[name]] = operator.value;
            } else if(name === "between"){
                field = operator.field;
                ret[field].$gt = operator.value[0];
                ret[field].$lt = operator.value[1];
            } else {
                throw new Error("Query Operator '" + name + "' is not supported!");
            }

            return ret;
        },
        translateExpressions: function (expressions) {
            var ret = [];
            for (var i = 0; i < expressions.length; i++) {
                var expression = expressions[i];
                if (expression.operator) {
                    ret.push(this.translateOperator(expression));
                } else if (expression instanceof Array) {
                    ret.push(this.translateExpressions(expression));
                } else {
                    ret.push(expression);
                }
            }
            return ret;
        }
    },{
        queryToMongoQuery: function(query){

            function translateArgs(args){
                var ret = [];
                for(var i = 0; i < args.length; i++){
                    var arg = args[i];
                    if(arg instanceof Query){
                        ret.push(translateOperator(arg));
                    } else if (arg instanceof Array){
                        ret.push(translateArgs(arg));
                    } else {
                        ret.push(arg);
                    }
                }
                return ret;
            }

            function translateOperator(operator) {
                var name = operator.name,
                    args = operator.args,
                    ret = {},
                    field;

                if (name === "or") {
                    ret["$or"] = translateArgs(args);
                } else if (name === "and") {
                    ret["$and"] = translateArgs(args);
                } else if (name == "eq") {
                    ret[args[0]] = args[1];
                } else if(RQLtoMongoMap[name]){
                    field = args[0];
                    ret[field] = {};
                    ret[field][RQLtoMongoMap[name]] = args[1];
                } else if(name === "between"){
                    field = args[0];
                    ret[field].$gt = args[1];
                    ret[field].$lt = args[2];
                } else {
                    throw new Error("Query Operator '"  + name + "' is not supported!");
                }

                return ret;
            }


            return translateOperator(query);
        }
    })


});