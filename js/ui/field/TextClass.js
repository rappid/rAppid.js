define(["xaml!js/ui/Field"], function (Field) {

    return Field.inherit("js.ui.field.TextClass", {
        defaults: {
            type: "text",
            value: "",
            size: "large",
            fieldName: "",
            placeholder: ""
        },

        $defaultContentName: "additionalControls",

        _renderAttributes: function ($) {
            this.callBase($);

            if (this.$firstInput && this.$firstInput.$el) {
                var $firstInput = this.$firstInput.$el;
                // sets all attributes that are supported by the input field to it
                var changes = {};
                for (var k in $) {
                    // special handling of default fields
                    if ($.hasOwnProperty(k) && k in $firstInput && !this.defaults.hasOwnProperty(k)) {
                        changes[k] = $[k];
                    }
                }
                this.$firstInput.set(changes);
            }
        }
    });
});