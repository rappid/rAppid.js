define(['js/ui/View'], function (View) {

    return View.inherit('js.ui.CheckboxClass', {
        defaults: {
            componentClass: 'checkbox',
            checked: false,
            value: null,
            label: "",
            name: null,
            inputValue: null,
            inputId: null,
            selected: "{checked}"
        },

        _renderLabel: function (label) {
            this._renderTemplateToPlaceHolder('label', 'label', {$label: label || ""});
        },
        getInputValue: function () {
            return this.$.inputValue != null ? this.$.inputValue : this.$.value;
        }.onChange('value', 'displayValue')
    });
});