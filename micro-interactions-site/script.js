document.addEventListener('DOMContentLoaded', function() {
    const brands = document.querySelectorAll('.brand');

    brands.forEach(brand => {
        let isClicked = false;
        brand.addEventListener('click', function() {
            if (isClicked) {
                brand.style.backgroundColor = 'white';
            } else {
                brand.style.backgroundColor = '#2196F3'; // blue
            }
            isClicked = !isClicked;
        });
    });
});