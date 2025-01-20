var Counter;
    (function(Counter){
    console.log("applied counter");

    function init() { 
        document.querySelectorAll('.counter').forEach(counter => {
            const countSpan = counter.querySelector('.count');
            const incrementBtn = counter.querySelector('.increment');
            const decrementBtn = counter.querySelector('.decrement');
    
            let count = 0;
    
            function UpdateText() { countSpan.textContent = count; }
            
            function increment() { count++; UpdateText();}
    
            function decrement() { count--; UpdateText();}

            _be(incrementBtn, 'click', increment);
            _be(decrementBtn, 'click', decrement);
        });
    }

    Counter.init = init;
})(Counter || (Counter = {}));
