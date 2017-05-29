// Legacy's stock 

Array.prototype.random = function() { 
    return this[Math.floor(Math.random() * this.length)];
}; 

Array.prototype.shuffle = function() { 
    return this.sort(function() { 
        return Math.random() - 0.5; 
    });
};

Function.prototype.__extends = function(superClass) { 
    this.prototype = Object.create(superClass.prototype);
}; 

Object._entries = function(obj) {
    var entry = [];
    for (key in obj)
        entry[entry.length] = [key, obj[key]];
    
    return entry;
};
