document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.lazy-image');
  images.forEach(image => {
    image.srcset = image.dataset.srcset;
    image.setAttribute('loading', 'lazy');
    image.onload = () => {
      // Callback to trigger the lazy image load event if needed
    };
  });
});