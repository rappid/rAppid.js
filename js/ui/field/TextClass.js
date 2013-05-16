define(["js/ui/Field"], function (Field) {

    return Field.inherit("js.ui.field.TextClass", {
        defaults: {
            type: "text",
            value: "",
            size: "large",
            placeholder: ""
        },

        $defaultContentName: "additionalControls"
    });
});