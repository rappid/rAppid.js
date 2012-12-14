define([],function(){

    var round = Math.round;

    Math.round = function(value, digits){
        if(digits){
            var pow = Math.pow(10, digits);
            return round(value * pow) / pow;
        }
        return round(value);
    };

    return true;
});