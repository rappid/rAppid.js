define(["js/ui/View"], function (View) {

    return View.inherit("js.ui.ProgressBarClass", {

        defaults: {
            min: 0,
            max: 100,
            value: 0
        },

        _barWidth: function () {
            if (this.$.min >= this.$.max) {
                return 0;
            }

            var width = (this.$.value / (this.$.max - this.$.min)) * 100;
            width = Math.round(width * 100) / 100;

            return width + "%";
        }.onChange('min', 'max', 'value')
    });

});