define(['js/ui/View'], function (View) {

    return View.inherit('js.ui.CheckboxClass', {
        defaults: {
            componentClass: 'checkbox',
            checked: false,
            value: null,
            label: ""
        },
        _renderLabel: function (label, oldLabel) {
            if (label) {
                this._renderTemplateToPlaceHolder('label', 'label', {$label: label});
            }
        }
    });
});