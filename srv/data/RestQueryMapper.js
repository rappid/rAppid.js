define(['js/data/mapper/RestQueryMapper','query','srv/lib/conditionParser'],function(RestQueryMapper, query, parser){

    return RestQueryMapper.inherit('srv.data.RestQueryMapper', {

        parse: function(parameter){
            var q = query();

            if(parameter.where){
                q.query.where = this._parseCondition(parameter.where);
            }

            return q;
        },

        _parseCondition: function(condition){
            var tree = parser.parse(condition);

            return this._parseTree(tree, null);
        },

        _parseTree: function(tree){
            var name = tree.name,
                args = tree.args;

            // || name === "or"
            if(name === "and" || name === "or"){
                var w = query().where(name),
                    arg;
                for(var i = 0; i < args.length; i++){
                    arg = args[i];
                    if(arg.name && arg.args){
                        var expression = this._parseTree(arg);
                        if(expression){
                            w.push(expression);
                        } else {
                            w[arg.name].apply(w, arg.args);
                        }
                    }
                }
                return w;
            }
        }
    });



});