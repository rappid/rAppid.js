define(["js/core/Component"], function(Component) {

    return Component.inherit('js.core.Head', {
        ctor: function() {
            this.callBase();
            this.$headManager = this.$stage.$headManager;
            this.bind('change',this.render, this);
        },
        render: function(){
            this.$headManager.set(this.$);
        }
    });

});