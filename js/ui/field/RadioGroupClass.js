define(["xaml!js/ui/Field"], function (Field) {

    return Field.inherit("js.ui.field.RadioGroupClass", {

        defaults: {
            $radioGroup: null
        },

        $defaultContentName: null,

        addChild: function (child) {
            if (this.$.$radioGroup) {
                this.$.$radioGroup.addChild(child);
            } else {
                this.callBase();
            }
        }
    });
});