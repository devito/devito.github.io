(function(){
console.log("applied");
document.querySelectorAll('.counter').forEach(counter => {
    const countSpan = counter.querySelector('.count');
    const incrementBtn = counter.querySelector('.increment');
    const decrementBtn = counter.querySelector('.decrement');

    let count = 0;

    _be(incrementBtn, 'click', () => {
        count++;
        countSpan.textContent = count;
    });    

    _be(incrementBtn, 'click', () => {
        count++;
        countSpan.textContent = count;
    });
});})();
