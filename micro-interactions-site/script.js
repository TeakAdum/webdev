document.addEventListener('DOMContentLoaded', function() {
    const colorBox = document.getElementById('colorBox');
    let isOrange = true;

    colorBox.addEventListener('click', function() {
        if (isOrange) {
            colorBox.style.backgroundColor = '#9C27B0';
        } else {
            colorBox.style.backgroundColor = '#FF9800';
        }
        isOrange = !isOrange;
    });
});