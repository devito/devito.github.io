(function() {
    console.log("This is an IIFE!");

    window["globalFunction"] = function() {
        console.log("global function called");
    }
})();