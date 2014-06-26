define(["xaml!js/ui/Field"], function (Field) {

    return Field.inherit("js.ui.field.TextAreaClass", {
        defaults: {
            value: "",
            size: "large",
            placeholder: "",
            maxLength: 0
        },

        $classAttributes: ['size', 'type'],

        $defaultContentName: "additionalControls"
    });
});