define(['js/ui/View'], function (View, DataGridColumn, List, _) {

    return View.inherit('js.ui.DataGridClass', {
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