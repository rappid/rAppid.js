var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.core.List", ["js.core.EventDispatcher"], function(EventDispatcher) {
        return EventDispatcher.inherit({


            ctor: function(items){
                this.$items = items || [];
                this.callBase();

                var self = this;
                this.bind('add', function () {
                    self.length = self.size();
                });
//                this.bind('remove', function () {
//                    self.length = self.size();
//                });

                this.length = this.size();
            },
            push: function(item){
                this.$items.push(item);
                this.trigger('add', {item:item, index:this.$items.length-1});
            },
            pop: function(){
                return this.removeAt(this.$items.length);
            },
            shift: function(){
                return this.removeAt(0);
            },
            unshift: function(item){
                this.$items.unshift(item);
                this.trigger('add', {item:item, index: 0});
            },
            add: function(items, index){
                if(rAppid._.isUndefined(index) || index > this.$items.length){
                    index = this.$items.length;
                }
                if(!rAppid._.isArray(items)){
                    items = [items];
                }
                var item, itemIndex;
                for(var i = 0; i < items.length; i++){

                    item = items[i];
                    itemIndex = index+i;
                    this.$items.splice(itemIndex,0,item);
                    this.trigger('add', {item:item, index:itemIndex})
                }

            },
            remove: function(items){
                if(!rAppid._.isArray(items)){
                    items  = [items];
                }
                for(var i = 0 ; i < items.length; i++){
                    this.removeAt(this.$items.indexOf(items[i]));
                }
            },
            removeAt: function(index){
                if(index > -1 && index < this.$items.length){
                    var items = this.$items.splice(index,1);
                    this.trigger('remove', {item: items[0], index: index});
                    return items[0];
                }
                return null;
            },
            reset: function(items){
                this.$items = items;
                this.trigger('reset',items);
            },
            sort: function(fnc){
                this.reset(this.$items.sort(fnc));
            },
            clear: function(){
                this.reset([]);
            },
            size: function(){
                return this.$items.length;
            }.on('add','remove')
            ,
            at: function(index){
                if(index < this.$items.length && index >= 0){
                    return this.$items[index];
                }
                return null;
            },
            each: function(fnc,scope){
                scope = scope || this;
                for(var i = 0; i < this.$items.length; i++){
                    fnc.call(scope,this.$items[i],i);
                }
            }
        })
    })
});