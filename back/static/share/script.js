window.addEventListener('scroll', function() {
  var header = document.getElementById('header');
  // When the scroll is higher than 50 viewport height, add the "scrolled" class to the header tag
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// NUEVO CÓDIGO para el Menú Hamburguesa
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');

  toggleButton.addEventListener('click', function() {
    // Alterna la clase 'active' en la navegación para mostrar/ocultar
    mainNav.classList.toggle('active');

    // Alterna la clase 'active' en el botón para el efecto de la 'X'
    toggleButton.classList.toggle('active');

    // Alterna el atributo ARIA para accesibilidad
    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true' || false;
    toggleButton.setAttribute('aria-expanded', !isExpanded);
  });

  // -------------------------------------------------------------------
  // NUEVO CÓDIGO para el Tema Claro/Oscuro (Actualizado el nombre de la variable)
  // -------------------------------------------------------------------
  const themeCheckbox = document.getElementById('checkbox'); // <--- AHORA ES CHECKBOX
  const body = document.body;

  /**
   * Función para aplicar la clase (simplificada para usar el estado del checkbox)
   */
  function applyTheme(isLight) {
    if (isLight) {
      body.classList.add('light-theme');
      themeCheckbox.checked = true; // Asegura que el checkbox esté marcado
    } else {
      body.classList.remove('light-theme');
      themeCheckbox.checked = false; // Asegura que el checkbox no esté marcado
    }
  }

  /**
   * 1. Cargar preferencia: Oscuro por defecto si no hay nada guardado.
   */
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light') {
    applyTheme(true);
  } else {
    // Oscuro por defecto
    applyTheme(false);
  }

  /**
   * 2. Evento del botón de cambio de tema (Escuchando 'change' en el checkbox)
   */
  themeCheckbox.addEventListener('change', function() {
    if (this.checked) { // Si el checkbox está marcado (Checked = Tema Claro)
      localStorage.setItem('theme', 'light');
      body.classList.add('light-theme');
    } else { // Si el checkbox NO está marcado (Unchecked = Tema Oscuro)
      localStorage.setItem('theme', 'dark');
      body.classList.remove('light-theme');
    }
  });
});
