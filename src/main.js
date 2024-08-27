//public/main.js
console.log('main.js loaded');

// import app from '../src/firebase/firebase-config.js';
// import db from '../src/firebase/firestore.js';
// import auth from '../src/firebase/auth.js';

// import {
//   setNavbarContent,
//   setUserProfileContents,
//   setListViewContent,
//   getDocumentsByUserId,
//   updateLastOnlineTimer,
//   loadSavedColorVariables,
//   handleSearchBar,
//   handleImageSelect,
//   saveChanges,
//   handleEditSvg,
//   handleDeleteSvg,
//   handleSettingsSaveButton,
//   handleLoginButton,
//   handleRegisterButton,
//   handleSaveButton,
//   JournalEntry,
//   generateCustomId
// } from '../src/utils/helpers.js';

// Global variables
let currentUser = null;
let currentSelectedEntry = null;
let base64String = null;

let path = null;

document.addEventListener('DOMContentLoaded', function (event) {
  loadSavedColorVariables();

  console.log('DOM loaded');
});

export async function initializePage(pathName) {
  path = pathName;

  const saveButton = document.getElementById('button-save');
  const loginButton = document.getElementById('button-signin');
  const registerButton = document.getElementById('button-register');
  const settingsSaveButton = document.getElementById('button-settings-save');
  const saveChangesButton = document.getElementById('pop-button-save');

  // Set up auth state listener
  await onAuthStateChanged(auth, (user) => {
    // Functions that launch after page refresh or auth state change
    console.log('currentUser set');
    currentUser = user;

    setNavbarContent();

    if (currentUser) {
      updateLastOnlineTimer();
      if (path === '/settings' || path === '/profile') {
        console.log('called setUserProfileContents() successfully');
        setUserProfileContents();
      }
      console.log(`User is signed in with UID: ${currentUser.uid}`);
    } else {
      console.log('User is signed out');
      console.log('did NOT called setUserProfileContents()');
    }
    // Execute page-specific actions
    if (path === '/journal') {
      console.log('trying to set list view content');
      setListViewContent();
      console.log('handle save button');
      handleSaveButton(saveButton);
      saveChangesButton.addEventListener('click', saveChanges);
    } else if (path === '/settings') {
      console.log('handle settings save button');

      handleSettingsSaveButton(settingsSaveButton);
      handleImageSelect();
    } else if (path === '/signin') {
      if (loginButton) {
        handleLoginButton(loginButton);
        console.log('login button found!');
      } else {
        console.log('login button NOT found!');
      }
    } else if (path === '/register') {
      console.log('register button found!');

      handleRegisterButton(registerButton);
    } else if (path === '/friends') {
      console.log('friends button found!');

      handleSearchBar();
    }
  });
}
