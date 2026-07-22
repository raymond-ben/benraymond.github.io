const images = document.querySelectorAll(".carousel-image");
const dots = document.querySelectorAll(".dot");
const previousButton = document.querySelector(".previous");
const nextButton = document.querySelector(".next");

let currentImage = 0;

function showImage(index) {
    images.forEach((image) => {
        image.classList.remove("active");
    });

    dots.forEach((dot) => {
        dot.classList.remove("active");
    });

    images[index].classList.add("active");
    dots[index].classList.add("active");
}

function showNextImage() {
    currentImage++;

    if (currentImage >= images.length) {
        currentImage = 0;
    }

    showImage(currentImage);
}

function showPreviousImage() {
    currentImage--;

    if (currentImage < 0) {
        currentImage = images.length - 1;
    }

    showImage(currentImage);
}

nextButton.addEventListener("click", showNextImage);
previousButton.addEventListener("click", showPreviousImage);

dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        currentImage = index;
        showImage(currentImage);
    });
});