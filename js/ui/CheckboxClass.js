define(['js/ui/View'], function (View) {

    return View.inherit('js.ui.CheckboxClass', {
        defaults: {
            componentClass: 'checkbox',
            selected: false,
            value: null,
            label: ""
        },
        $classAttributes: ['label', 'name'],
        _renderLabel: function (label, oldLabel) {
            if (label) {
                this._renderTemplateToPlaceHolder('label', 'label', {$label: label});
            }
        }
    });
});