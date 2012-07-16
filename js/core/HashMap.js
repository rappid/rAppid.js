define(["js/core/Bindable", "underscore"],
    function (Bindable, _) {

        return Bindable.inherit("js.core.HashMap",
            {
                ctor: function (attributes) {
                    this.$items = [];

                    // call the base class constructor
                    this.callBase();
                },
                _commitChangedAttributes: function(attributes){
                    for(var key in attributes){
                        if(attributes.hasOwnProperty(key)){
                            if(_.isUndefined(this.$previousAttributes[key])){
                                this.$items.push(attributes[key]);
                            }
                            if(_.isUndefined(attributes[key])){
                                this.$items.splice(this.$items.indexOf(this.$previousAttributes[key]),1);
                            }
                        }
                    }
                },
                each: function(fnc, scope){
                    scope = scope || this;
                    for(var key in this.$){
                        if(this.$.hasOwnProperty(key)){
                            fnc.call(scope, this.$[key]);
                        }
                    }
                },
                size: function(){
                    return this.$items.length;
                }.on('change')
            });

    });