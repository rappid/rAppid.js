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

            var $firstInput = this.$firstInput.$el;
            if ($firstInput) {
                // sets all attributes that are supported by the input field to it
                var changes = {};
                for (var k in $) {
                    if ($.hasOwnProperty(k) && k in $firstInput) {
                        // special handling of default fields
                        if (this.defaults.hasOwnProperty(k)) {
                            continue;
                        }
                        changes[k] = $[k];
                    }
                }
                this.$firstInput.set(changes);
            }
        }
    });
});