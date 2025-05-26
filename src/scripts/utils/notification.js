const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.setAttribute('role', 'alert');
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

const showLoading = (button) => {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading');
  
  button.prepend(spinner);
  button.disabled = true;
};

const hideLoading = (button) => {
  const spinner = button.querySelector('.loading-spinner');
  if (spinner) spinner.remove();
  button.disabled = false;
};

export { showNotification, showLoading, hideLoading };