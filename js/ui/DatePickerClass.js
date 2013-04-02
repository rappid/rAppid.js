define(['js/ui/View', 'js/core/Bindable','moment'], function(View, Bindable, moment) {

    return View.inherit('js.ui.DatePickerClass', {
        defaults: {
            date: null,
            minYear: ((new Date()).getFullYear() - 10),
            maxYear: ((new Date()).getFullYear() + 10),
            _viewDate: Date
        },

        initialize: function(){
            if(this.$.date){
                this.set({
                    _viewDate: this.$.date
                });
            }
            this.callBase();
        },

        _years: function(){
            var years = [];
            for(var i = this.$.minYear; i <= this.$.maxYear; i++){
                years.push(i);
            }
            return years;
        },

        _months: function(){
            var months = [];
            for(var i = 0; i < 12; i++){
                months.push(i);
            }
            return months;
        },

        _monthName: function(i){
            return moment().month(i).format('MMM');
        },

        _days: function(){
            var days = [];
            for (var i = 0; i < 7; i++) {
                days.push(i+1);
            }
            return days;
        },

        _weeks: function () {
            var weeks = [],
                numWeeks = 5,
                day = moment(this.$._viewDate).day();

            var daysInMonth = moment(this.$._viewDate).daysInMonth();

            // TODO: fix this
            if(day === 0 || day > 4){
                numWeeks = 6;
            }

            for (var i = 0; i < numWeeks; i++) {
                weeks.push(i);
            }
            return weeks;
        }.onChange('_viewDate'),

        _dayName: function(day){
            return moment().day(day).format("dd");
        },

        _calendarDate: function(week, day){
            return moment([this.$._viewDate.getFullYear(), this.$._viewDate.getMonth(),week * 7]).day(day).toDate();
        }.onChange('_viewDate'),

        _onNextMonth: function(){
            // TODO : add timeout
            var tmp = moment(this.$._viewDate).clone().add('months',1);
            this.set('_viewDate', tmp.toDate());
        },
        _onPrevMonth: function(){
            // TODO : add timeout
            var tmp = moment(this.$._viewDate).clone().add('months', -1);
            this.set('_viewDate', tmp.toDate());
        },
        _onMonthChange: function(e){
            var month = e.target.$.selectedItem;
            this.set('_viewDate', moment([this.$._viewDate.getFullYear(), month, 1]).toDate());
        },
        _onYearChange: function(e){
            var year = e.target.$.selectedItem;
            this.set('_viewDate', moment([year, this.$._viewDate.getMonth(), 1]).toDate());
        },
        _onDateSelect: function(e){
            var itemDate = e.target.find('_itemDate');
            if(itemDate.getMonth() !== this.$._viewDate.getMonth()){
                this.set('_viewDate',moment([itemDate.getFullYear(),itemDate.getMonth()]).toDate());
            }
            this.set('date', itemDate);
        },

        _isCurrentDate: function(date){
            return this.$.date && date && date.getTime() === this.$.date.getTime();
        }.onChange('date')
    });
});