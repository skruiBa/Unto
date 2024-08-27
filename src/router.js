// public/router.js
console.log('router.js loaded');

import { initializePage } from './main.js';

const routes = {
  404: { title: '404', template: 'templates/404.html' },
  '/': { title: 'Home', template: 'templates/default.html' },
  '/journal': { title: 'Journal', template: 'templates/journal.html' },
  '/signin': { title: 'Sign In', template: 'templates/signin.html' },
  '/profile': { title: 'Profile', template: 'templates/profile.html' },
  '/settings': { title: 'Settings', template: 'templates/settings.html' },
  '/friends': { title: 'Friends', template: 'templates/friends.html' },
  '/register': { title: 'Register', template: 'templates/register.html' }
};

const route = (event) => {
  event = event || window.event;
  event.preventDefault();
  window.history.pushState({}, '', event.target.href);
  handleLocation();
};

const handleLocation = async () => {
  console.log('---------------SWITCHING PATH --------------');

  const path = window.location.pathname;
  const route = routes[path] || routes[404];
  try {
    const response = await fetch(`templates/${route.template.split('/').pop()}`);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    document.getElementById('content').innerHTML = html;

    document.title = route.title;
    console.log('html loaded successfully');
    console.log('path is ' + path);

    initializePage(path);
  } catch (error) {
    console.error('Error loading template:', error);
    // Handle the error appropriately
  }
};

window.onpopstate = handleLocation;
window.route = route;

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      route(e);
    }
  });

  handleLocation();
});

const getCurrentRoute = () => {
  const path = window.location.pathname;
  return routes[path] || routes[404];
};

window.getCurrentRoute = getCurrentRoute;
