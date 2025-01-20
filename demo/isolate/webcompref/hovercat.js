var HoverCat;
(function (HoverCat) {
    console.log("applied hovercat");

    function init() {
        document.addEventListener('DOMContentLoaded', function () {
            const thumbnail = document.querySelector('.thumbnail');
            const largeImage = document.querySelector('.large-image');

            thumbnail.addEventListener('mouseover', function () {
                largeImage.style.display = 'block';
            });

            thumbnail.addEventListener('mouseout', function () {
                largeImage.style.display = 'none';
            });
        });
    }

    HoverCat.init = init;
})(HoverCat || (HoverCat = {}))
