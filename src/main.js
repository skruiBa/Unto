//public/main.js
console.log('main.js loaded');

import { app } from '../src/firebase/firebase-config.js';

import { db } from '../src/firebase/firestore.js';
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { auth } from '../src/firebase/auth.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  setNavbarContent,
  setUserProfileContents,
  setListViewContent,
  getDocumentsByUserId,
  updateLastOnlineTimer,
  loadSavedColorVariables,
  handleSearchBar,
  handleImageSelect,
  saveChanges,
  handleEditSvg,
  handleDeleteSvg,
  handleSettingsSaveButton,
  handleLoginButton,
  handleRegisterButton,
  handleSaveButton,
  JournalEntry,
  generateCustomId
} from '../src/utils/helpers.js';
import {
  setCurrentUser,
  setCurrentSelectedEntry,
  setBase64String,
  setPath,
  getCurrentUser,
  getCurrentSelectedEntry,
  getBase64String,
  getPath
} from './state.js';

document.addEventListener('DOMContentLoaded', function (event) {
  loadSavedColorVariables();

  console.log('DOM loaded');
});

export async function initializePage(pathName) {
  setPath(pathName);

  const saveButton = document.getElementById('button-save');
  const loginButton = document.getElementById('button-signin');
  const registerButton = document.getElementById('button-register');
  const settingsSaveButton = document.getElementById('button-settings-save');
  const saveChangesButton = document.getElementById('pop-button-save');

  // Set up auth state listener
  await onAuthStateChanged(auth, (user) => {
    // Functions that launch after page refresh or auth state change
    console.log('currentUser set');
    setCurrentUser(user);

    setNavbarContent();

    if (getCurrentUser()) {
      updateLastOnlineTimer();
      if (getPath() === '/settings' || getPath() === '/profile') {
        setUserProfileContents();
      }
      console.log(`User is signed in with UID: ${getCurrentUser().uid}`);
    } else {
      console.log('User is signed out');
    }
    // Execute page-specific actions
    if (getPath() === '/journal') {
      console.log('trying to set list view content');
      setListViewContent();
      console.log('handle save button');
      handleSaveButton(saveButton);
      saveChangesButton.addEventListener('click', saveChanges);
    } else if (getPath() === '/settings') {
      console.log('handle settings save button');

      handleSettingsSaveButton(settingsSaveButton);
      handleImageSelect();
    } else if (getPath() === '/signin') {
      if (loginButton) {
        handleLoginButton(loginButton);
        console.log('login button found!');
      } else {
        console.log('login button NOT found!');
      }
    } else if (getPath() === '/register') {
      console.log('register button found!');

      handleRegisterButton(registerButton);
    } else if (getPath() === '/friends') {
      console.log('friends button found!');

      handleSearchBar();
    }
  });
}
