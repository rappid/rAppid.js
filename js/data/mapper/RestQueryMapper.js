define(["js/data/QueryMapper","underscore"], function (QueryMapper, _) {

    var comparatorMap = {
        "eq": "=",
        "gt": ">",
        "lt": "<",
        "lte": "<=",
        "gte": ">="
    };

    return QueryMapper.inherit('js.data.mapper.RestQueryMapper', {

        compose: function (query) {

            var hash = query.toObject();

            if(hash.sort){
                hash.sort = this.translateSort(hashSort);
            }

            if (hash.where) {
                hash.where = this.translateOperator(hash.where)
            }

            return hash;
        },

        translateSort: function(sort){
            return sort;
        },

        translateOperator: function (operator) {
            var name = operator.name;
            if (name === "and" || name === "or") {
                var expressions = this.translateExpressions(operator.expressions).join(" " + name + " ");
                if(expressions.length > 1){
                    return "(" + expressions + ")";
                }
                return expressions;
            } else if (comparatorMap.hasOwnProperty(name)) {
                return operator.field + comparatorMap[name] + operator.value;
            } else if (operator.field && !_.isUndefined(operator.value)) {
                var value = operator.value;
                if(operator.value instanceof Array){
                    value = "(" + operator.value.join(",") + ")";
                }
                return operator.name + " ( " + operator.field + "," + value + ")";
            } else {
                return operator;
            }
        },

        translateExpressions: function (expressions) {
            var ret = [];
            for (var i = 0; i < expressions.length; i++) {
                ret.push(this.translateOperator(expressions[i]));
            }
            return ret;
        }

    });


});