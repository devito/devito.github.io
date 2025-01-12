(function(){
console.log("applied");
_doc.querySelectorAll('.counter').forEach(counter => {
    const countSpan = counter.querySelector('.count');
    const incrementBtn = counter.querySelector('.increment');
    const decrementBtn = counter.querySelector('.decrement');

    let count = 0;

    incrementBtn.addEventListener('click', () => {
        count++;
        countSpan.textContent = count;
    });

    decrementBtn.addEventListener('click', () => {
        count--;
        countSpan.textContent = count;
    });
});})();
