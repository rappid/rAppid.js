rAppid.defineClass("js.ui.Scrollable",
    ["underscore", "js.html.DomElement","js.ui.View"], function (_, DomElement, View) {
        return View.inherit({
            defaults: {
                tagName: "div",
                currentPage: 0
            },
            _collectChild: function(child){
               if(child instanceof DomElement){
                   if(!this.$pages){
                       this.$pages = [];
                   }
                   this.$pages.push(child);
               }
            },
            _renderChild: function(child){
                child.set({visible: false});
                this.callBase();

                if(!this.$visibleView){
                    this.set({visibleView: child});
                }
            },
            _renderVisibleView: function(child){
                var c;
                // hide other views
                for(var i = 0; i < this.$childViews; i++){
                    if(c != child && c.get('visible') === false){
                        c.set({visible: false});
                    }
                }

                if(!child.isRendered()){
                    child.set({visible: true});
                }
            },
            _renderVisibleIndex: function(index){
                if(index > -1 && index < this.$childViews.length){
                   this.set({visibleView: this.$childViews[index]});
                }
            }

        });
    }
);