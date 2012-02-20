rAppid.defineClass("js.ui.List",
    ["underscore", "js.ui.View", "js.core.Template"], function (_, View, Template) {
        return View.inherit({
            defaults: {
                tagName: "div",
                needsSelection: false,
                multiSelect: false,
                items: []
            },
            _collectChild: function(child){
                if(child instanceof Template){
                    this.$itemRenderer = child;
                }else if(child instanceof View){
                    if(!this.$childViews) {
                        this.$childViews = [];
                    }
                    this.$childViews.push(child);
                }
            },
            _renderItems: function(items){
                // TODO: remove this initialize
                var item, comp;
                for(var i = 0 ; i < items.length; i++){
                    item = items[i];
                    if(this.$itemRenderer){
                        comp = this.$itemRenderer.createComponents({$item: item})[0];
                        this.addChild(comp);
                    }
                }
            },
            _renderChild: function(child){
                if(child instanceof View){
                    var self = this;
                    child.set({selectable: true});
                    child.on('change:selected', function(e,c){
                        self._onChildSelected(c);
                    },child);

                }
                if(this.$.needsSelection === true){
                    child.set({selected: true});
                }
                this.callBase();
            },
            _renderSelectedItem: function(item){
                // TODO: implement
                // get view for item
                // if there is a view, select the view basta!
                // set selected
            },
            _renderSelectedIndex: function(i){
                if(i > -1 && i < this.$childViews.length){
                    this.$childViews[i].set({selected: true});
                }
            },
            _onChildSelected: function(child){
                var c, i;
                if (child.$.selected === true && this.$.multiSelect === false) {

                    for(i = 0; i < this.$childViews.length; i++){
                        c = this.$children[i];
                        if(c != child){
                           c.set({selected: false});
                        }
                    }
                }else if(child.$.selected === false && this.$.needsSelection === true){
                    var somethingSelected = false;
                    for (i = 0; i < this.$childViews.length; i++) {
                        c = this.$children[i];
                        if(c.$.selected === true){
                            somethingSelected = true;
                            break;
                        }
                    }
                    if(somethingSelected === false){
                        child.set({selected: true});
                    }
                }
            }
        });
    }
);