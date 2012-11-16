define(['xaml!js/ui/DataGridColumn','moment'], function (Column, moment) {

    return Column.inherit('js.ui.DataGridDateColumn', {
        defaults : {
            dateFormat : 'MM-DD-YYYY',
            parseFormat: 'YYYY-MM-DDTHH:mm:ssZ'
        },
        getFormatFnc: function(){
            if(!this.$formatFnc){
                var self = this;
                this.$formatFnc = function (data) {
                    if (!data) {
                        return null;
                    }
                    return  moment(data).format(self.$.dateFormat);
                };
            }
            return this.$formatFnc;
        }
    });
});