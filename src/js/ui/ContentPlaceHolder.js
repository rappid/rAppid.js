rAppid.defineClass("js.ui.ContentPlaceHolder", ["js.html.DomElement"], function(View) {
    return View.inherit(({
        _renderContent: function(content){
            if(content){
                this._renderChildren(content.$children);
            }else{
                // TODO: remove children
            }
        }
    }));
});