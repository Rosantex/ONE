// Legacy's stock

Array.prototype.random = function() {
        return this[Math.floor(Math.random() * this.length)];
    };
       
    Array.prototype.shuffle = function() {
        return this.sort(function() {
            return Math.random() - 0.5;
        });
    };
    Function.prototype.__extends = function(parent) {
        this.prototype = Object.create(parent.prototype);
    };

    var T = setTimeout;

    function R(x, y) {
        return y ? x + Math.floor(Math.random() * (y - x + 1)) : R(0, x);
    }
