define([],function(){

    var round = Math.round;

    Math.round = function(value, digits){
        if(digits){
            var pow = Math.pow(10, digits);
            return round(value * pow) / pow;
        }
        return round(value);
    };

    if (!Date.now) {
        Date.now = function now() {
            return +(new Date);
        };
    }

    return true;
});