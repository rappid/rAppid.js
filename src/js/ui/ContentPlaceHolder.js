rAppid.defineClass("js.ui.ContentPlaceHolder", ["js.ui.View"], function(View) {
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