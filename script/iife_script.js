var counter = 0;
(function() {
    counter++;
    console.log(`This IIFE is called!`);

    window["globalFunction"] = function() {
        console.log(`global function initialized ${counter} times`);
    }
})();