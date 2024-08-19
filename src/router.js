// router.js

const routes = {
  404: { title: '404', template: 'src/templates/404.html' },
  '/': { title: 'Home', template: 'src/templates/default.html' },
  '/journal': { title: 'Journal', template: 'src/templates/journal.html' },
  '/signin': { title: 'Sign In', template: 'src/templates/signin.html' },
  '/profile': { title: 'Profile', template: 'src/templates/profile.html' },
  '/settings': { title: 'Settings', template: 'src/templates/settings.html' },
  '/friends': { title: 'Friends', template: 'src/templates/friends.html' },
  '/register': { title: 'Register', template: 'src/templates/register.html' }
};

const route = (event) => {
  event = event || window.event;
  event.preventDefault();
  window.history.pushState({}, '', event.target.href);
  handleLocation();
};

const handleLocation = async () => {
  const path = window.location.pathname;
  const route = routes[path] || routes[404];
  const html = await fetch(route.template).then((data) => data.text());
  document.getElementById('content').innerHTML = html;
  document.title = route.title;
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
