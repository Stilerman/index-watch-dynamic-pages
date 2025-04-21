
// Основные функции, используемые на всех страницах

// Функция для показа уведомлений
function showToast(type, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Обработка существующих flash-сообщений от сервера
document.addEventListener('DOMContentLoaded', function() {
  const flashMessages = document.querySelectorAll('.toast');
  
  flashMessages.forEach(toast => {
    if (!toast.classList.contains('show')) {
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.parentNode.removeChild(toast);
        }, 300);
      }, 3000);
    }
  });
  
  // Инициализация выпадающих меню
  document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Закрыть все другие открытые меню
      document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
        if (menu !== this.nextElementSibling) {
          menu.classList.remove('active');
        }
      });
      
      // Переключить текущее меню
      this.nextElementSibling.classList.toggle('active');
    });
  });
  
  // Закрыть все меню при клике вне их
  document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
      menu.classList.remove('active');
    });
  });
});

// Предотвращение закрытия при клике внутри выпадающего меню
document.addEventListener('click', function(event) {
  if (event.target.closest('.dropdown-menu')) {
    event.stopPropagation();
  }
});
