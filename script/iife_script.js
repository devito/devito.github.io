var counter = counter || 0;
(function() {
    counter++;
    console.log(`This IIFE is called!`);

    var internalCounter = 0;

    window["globalFunction"] = function() {
        internalCounter++;
        console.log(`global function initialized ${counter} times`);
        console.log(`internal counter is set to ${internalCounter}`);
    }
})();