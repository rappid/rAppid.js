define(["xaml!js/ui/Field"], function (Field) {

    return Field.inherit("js.ui.field.TextClass", {
        defaults: {
            type: "text",
            value: "",
            size: "large",
            fieldName: "",
            placeholder: ""
        },

        $defaultContentName: "additionalControls"
    });
});