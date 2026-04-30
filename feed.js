// Original social-feed.js file

function toggleLike(element) {
  // Incorrectly using onclick to add a click event handler
  element.onclick = function() {
    // Logic for handling the like button click
  };
}

export default { toggleLike };