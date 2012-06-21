define(['js/core/Bindable'], function(Bindable) {

    return Bindable.inherit('js.core.Bindable', {
        ctor: function(head) {
            this.$head = head;
            this.callBase(null);
        }
    });

});