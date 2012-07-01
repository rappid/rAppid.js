define(["js/core/Component"], function(Component) {

    return Component.inherit('js.core.Head', {


        ctor: function() {
            this.callBase();
            this.$head = this.$systemManager.$headManager;
        }
    });

});