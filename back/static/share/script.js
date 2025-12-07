window.addEventListener('scroll', function() {
  var header = document.getElementById('header');
  // When the scroll is higher than 50 viewport height, add the "scrolled" class to the header tag
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});
