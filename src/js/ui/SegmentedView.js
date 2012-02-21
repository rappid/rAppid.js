rAppid.defineClass("js.ui.SegmentedView",
    ["underscore", "js.ui.ItemsView", "js.html.DomElement"], function (_, ItemsView, DomElement) {
        return ItemsView.inherit({
            defaults:{
                tagName:"div",
                visibleIndex:0,
                visibleView:null
            },
            ctor: function(){
                this.callBase();
                this.$childViews = [];
            },
            _collectChild:function (child) {
                this.callBase();
                if (child instanceof DomElement) {
                    this.$childViews.push(child);
                }
            },
            _renderChild:function (child) {
                if (this.$.visibleView == child) {
                    child.set({visible:true});
                    this.callBase();
                }
            },
            _renderVisibleView:function (child, oldView) {
                if (oldView) {
                    oldView.set({visible:false});
                }

                if (child) {
                    if (!child.isRendered()) {
                        child.set({visible:false});
                        this._renderChild(child);
                    }
                    child.set({visible:true});
                }

            },
            _renderVisibleIndex:function (index) {
                if (index > -1 && index < this.$childViews.length) {
                    this.set({visibleView:this.$childViews[index]});
                }else if(this.$.visibleView){
                    this.$.visibleView.set({visible: false});
                }
            }

        });
    }
);