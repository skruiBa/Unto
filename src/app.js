// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
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
} from 'firebase/firestore';

import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBiscdF0tuWqOHERdRQdNlkvbQsmClDLbo',
  authDomain: 'dreamlog-7dff3.firebaseapp.com',
  projectId: 'dreamlog-7dff3',
  storageBucket: 'dreamlog-7dff3.appspot.com',
  messagingSenderId: '5989316723',
  appId: '1:5989316723:web:0f900af2b834566a8cd206',
  measurementId: 'G-RWSXHD4PFH'
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentSelectedEntry = null;
let base64String = null;

// Set navbar links if user is signed on/off
function setNavbarContent() {
  const navbarMenu = document.getElementById('navbar-menu');
  const mobileMenu = document.getElementById('mobile-menu');

  if (currentUser) {
    // If user is signed in
    navbarMenu.innerHTML = `
    <li class="navbar__item"><a href="/journal" data-link class="navbar__links">Journal</a></li>
    <li class="navbar__item"><a href="/friends" data-link class="navbar__links">Friends</a></li>
    <li class="navbar__item"><a href="/profile" data-link class="navbar__links">Profile</a></li>
    <li class="navbar__item"><a href="#" class="navbar__links sign-out-button">Sign out</a></li>
  `;
    mobileMenu.innerHTML = `
    <li class="mobile-menu__item"><a href="/journal" data-link class="mobile-menu__link">Journal</a></li>
    <li class="mobile-menu__item"><a href="/profile" data-link class="mobile-menu__link">Profile</a></li>
    <li class="mobile-menu__item"><a href="/friends" data-link class="mobile-menu__link">Friends</a></li>
    <li class="mobile-menu__item"><a href="#" id="sign-out-button" class="mobile-menu__link sign-out-button">Sign out</a></li>
  `;
  } else {
    // If user is not signed in
    navbarMenu.innerHTML = `
    <li class="navbar__item"><a href="/signin" data-link class="navbar__links">Sign In</a></li>
    <li class="navbar__item"><a href="/register" data-link class="navbar__links">Register</a></li>
  `;
    mobileMenu.innerHTML = `
    <li class="mobile-menu__item"><a href="/signin" data-link class="mobile-menu__link">Sign In</a></li>
    <li class="mobile-menu__item"><a href="/register" data-link class="mobile-menu__link">Register</a></li>
  `;
  }

  const signOutButtons = document.querySelectorAll('.sign-out-button');
  signOutButtons.forEach((button) => {
    button.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent the default link behavior
      signOut(auth)
        .then(() => {
          console.log('Signed out successfully');
          // window.location.href = '/signin.html';
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
    });
  });
}

async function setUserProfileContents() {
  // Profile fields
  const username = document.getElementById('username');
  const avatar = document.getElementById('profileAvatar');
  const labelLastOnline = document.getElementById('label-lastonline');
  const labelJoined = document.getElementById('label-joined');

  // Settings fields
  const usernameField = document.getElementById('usernameInput');
  const accentColor = document.getElementById('secondary-color');
  const accentColorDark = document.getElementById('secondary-color-dark');

  // Get current secondary color
  function getRootVariable(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  const rootSecondaryColor = getRootVariable('--secondary-color');
  const rootSecondaryColorDark = getRootVariable('--secondary-color-dark');

  function setRootVariable(variable, value) {
    document.documentElement.style.setProperty(variable, value);
    localStorage.setItem(variable, value);
  }

  try {
    // Reference to the "users" collection
    const usersDoc = collection(db, 'users');
    const usersSnapshot = await getDocs(usersDoc);

    // Set userdata to profile or settings
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();

      // Get right user with email check
      if (userData.email === currentUser.email && window.location.pathname === '/profile') {
        // Set username, from db
        username.textContent = userData.username;
        // Set accent colors, from db
        setRootVariable('--secondary-color', userData.accentColor);
        setRootVariable('--secondary-color-dark', userData.accentColorDark);

        // Set avatar / if no avatar set default, from db
        avatar.src = userData.avatarURL;
        avatar.onerror = function () {
          avatar.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        };
        // lastonline
        labelLastOnline.textContent = userData.lastOnlineDate + ' ' + userData.lastOnlineTime;
        //joined
        labelJoined.textContent = userData.joined ? userData.joined : 'unknown';
      } else if (userData.email === currentUser.email && window.location.pathname === '/settings') {
        // Set settings fields values
        usernameField.value = userData.username;
        accentColor.value = rootSecondaryColor;
        accentColorDark.value = rootSecondaryColorDark;
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}
// Listview
async function setListViewContent() {
  const listView = document.querySelector('.list-view');
  listView.innerHTML =
    ' <div class="list-header">My Dream entries <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#cbd5e0"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg></div> '; // Clear previous content and add header

  try {
    const documents = await getDocumentsByUserId('entries', 'userID', currentUser.uid);
    documents.forEach((doc) => {
      const textContentShort = doc.text.substring(0, 20);
      const listItem = document.createElement('div');
      listItem.className = 'list-item';

      listItem.innerHTML = `
          <div class="list-item__content">
            <div class="list-item__title" id="item-title">
              ${doc.title}
              <div id="delete-icon-${doc.id}">
                <svg class="list-item__icon" xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#cbd5e0">
                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                </svg>
              </div>
              <div id="edit-icon-${doc.id}">
                <svg class="list-item__icon" xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#cbd5e0">
                  <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                </svg>
              </div>
            </div>
            <div class="list-item__subtitle" id="item-subtitle">Date: ${doc.date}</div>
          </div>
    `;

      listView.appendChild(listItem);

      const editSvg = document.getElementById(`edit-icon-${doc.id}`);
      const deleteSvg = document.getElementById(`delete-icon-${doc.id}`);

      handleEditSvg(editSvg, doc);
      handleDeleteSvg(deleteSvg, doc);
    });
  } catch (error) {
    console.error('Error setting list view content:', error);
  }
}

async function getDocumentsByUserId(collectionName, neededVariable, variable) {
  const documents = [];
  try {
    const q = query(collection(db, collectionName), where(neededVariable, '==', variable));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error('Error getting documents: ', error);
  }
  console.log(documents);
  return documents;
}

// On every page load and refresh
document.addEventListener('DOMContentLoaded', function (event) {
  event.preventDefault();
  loadSavedColorVariables();
  initializePage();
  console.log('DOM fully loaded and parsed');
});

async function initializePage() {
  const saveButton = document.getElementById('button-save');
  const loginButton = document.getElementById('button-signin');
  const registerButton = document.getElementById('button-register');
  const settingsSaveButton = document.getElementById('button-settings-save');
  const saveChangesButton = document.getElementById('pop-button-save');

  // Set up auth state listener
  await onAuthStateChanged(auth, (user) => {
    // Functions that launch after page refresh or auth state change
    currentUser = user;
    setNavbarContent();

    if (currentUser) {
      updateLastOnlineTimer();
      if (window.location.pathname === '/settings' || window.location.pathname === '/profile') {
        setUserProfileContents();
      }
      console.log(`User is signed in with UID: ${currentUser.uid}`);
    } else {
      console.log('User is signed out');
    }

    // Execute page-specific actions
    if (window.location.pathname === '/journal') {
      setListViewContent();
      handleSaveButton(saveButton);
      saveChangesButton.addEventListener('click', saveChanges);
    } else if (window.location.pathname === '/settings') {
      handleSettingsSaveButton(settingsSaveButton);
      handleImageSelect();
    } else if (window.location.pathname === '/signin') {
      handleLoginButton(loginButton);
    } else if (window.location.pathname === '/register') {
      handleRegisterButton(registerButton);
    } else if (window.location.pathname === '/friends') {
      handleSearchBar();
    }
  });
}

async function updateLastOnlineTimer() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const dateStr = `${day}-${month}-${year}`;
  const timeStr = `${hours}:${minutes}`;

  try {
    const updatedData = {
      lastOnlineDate: dateStr,
      lastOnlineTime: timeStr
    };

    const docRef = doc(db, 'users', currentUser.uid); // Reference to the specific document
    await updateDoc(docRef, updatedData); // Perform the update
    console.log('updated online status timer');
  } catch (error) {
    console.error('updateLastOnlineTimer: ' + error);
  }
}

function loadSavedColorVariables() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('--')) {
      // Check if it's a CSS variable
      const value = localStorage.getItem(key);
      document.documentElement.style.setProperty(key, value);
    }
  });
}

// Friendlist
function handleSearchBar() {
  const searchBar = document.getElementById('search-bar');
  const searchIcon = document.getElementById('search-icon');
  const friendLV = document.getElementById('friendListView');
  let friendsList = [];

  const searchFriends = async () => {
    friendLV.innerHTML = ''; // Clear previous
    // Search by name
    console.log('friendlist length: ' + friendsList.length);

    try {
      const searchQuery = searchBar.value.trim().toLowerCase(); // Normalize query
      console.log(`Searching for friends with token: ${searchQuery}`);

      // Search through db for matching tokens
      let foundUser = await getDocumentsByUserId('users', 'username', searchQuery);
      foundUser.forEach((item) => {
        console.log('gufhisjodpskls' + item);
      });
      if (foundUser.length > 0) {
        foundUser.forEach((item) => {
          const isFriend = friendsList.includes(item.id);
          console.log('fromsearch');
          setFoundUser(item, isFriend);
        });
      } else {
        console.log('nothign found or no search made');
        setDefaultFriends();
      }
    } catch (error) {
      console.error('search error: ' + error);
    }
  };
  const setFoundUser = (foundUser, isFriend) => {
    if (!foundUser || !foundUser.id) {
      console.error('Invalid foundUser:', foundUser);
      return;
    }

    const userDiv = document.createElement('div');
    userDiv.className = 'profile-container';

    // Determine the SVG icon based on friendship status
    const iconSVG = isFriend
      ? `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M640-520v-80h240v80H640Zm-280 40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z"/></svg>
        `
      : `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z"/></svg>
        `;

    userDiv.innerHTML = `
      <div class="container-icon">
        <img id="small-pfp" src="${foundUser.avatarURL}" style="user-select: none" />
      </div>
      <h1>${foundUser.username}</h1>
      <div class="container-buttons">
        <div class="container-button add" id="container-button-${foundUser.id}">
          ${iconSVG}
        </div>
      </div>
    `;
    friendLV.appendChild(userDiv);

    if (!isFriend) {
      const addFriendIcon = document.getElementById(`container-button-${foundUser.id}`);
      addFriendIcon.addEventListener('click', () => sendFriendRequest(currentUser.uid, foundUser.id));
    } else if (isFriend) {
      const delFriendIcon = document.getElementById(`container-button-${foundUser.id}`);
      delFriendIcon.addEventListener('click', () => deleteFriendship(currentUser.uid, foundUser.id));
    }
  };

  const setDefaultFriends = () => {
    if (dbSearchFriends() === false) {
      friendLV.innerHTML = `
      <h1>No frens or frens request :< </h1>
      `;
    } else {
      // show friends AND find friend requests
      dbSearchFriendRequests();
    }
  };
  const dbSearchFriendRequests = async () => {
    const friendRequestList = [];

    try {
      //userId2 = someone sent you req
      const q = query(
        collection(db, 'friends'),
        where('userId2', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        friendRequestList.push({ id: doc.id, ...doc.data() });
      });

      console.log(`you have ${friendRequestList.length} friend reqs`);
      if (friendRequestList.length > 0) {
        friendRequestList.forEach(async (item) => {
          // Get user2 specific info to show in request
          const userRef = doc(db, 'users', item.userId1);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          showFriendRequests(userData, item.id);
        });
      }
    } catch (error) {
      console.error('dbSearchFriendRequests' + error);
    }
  };
  const dbSearchFriends = async () => {
    const friends = [];
    friendsList = [];

    try {
      // find accepted friend request where userId1 equals currentUser.uid
      const q1 = query(
        collection(db, 'friends'),
        where('userId1', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      // find accepted friend request where userId2 equals currentUser.uid
      const q2 = query(
        collection(db, 'friends'),
        where('userId2', '==', currentUser.uid),
        where('status', '==', 'accepted')
      );

      // Execute both queries
      const [querySnapshot1, querySnapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      // Process the results from the first query
      querySnapshot1.forEach((doc) => {
        const data = doc.data();
        const friendId = data.userId2; // since userId1 is currentUser.uid
        friends.push({ id: doc.id, friendId });
        friendsList.push(friendId); // Store friend user IDs
      });

      // Process the results from the second query
      querySnapshot2.forEach((doc) => {
        const data = doc.data();
        const friendId = data.userId1; // since userId2 is currentUser.uid
        friends.push({ id: doc.id, friendId });
        friendsList.push(friendId); // Store friend user IDs
      });
      console.log(friendsList);

      // Get friends details from users using id
      const userPromises = friends.map(async (friend) => {
        console.log();

        const docRef = doc(db, 'users', friend.friendId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docSnapData = docSnap.data();
          console.log('from dbsearch');
          setFoundUser({ ...docSnapData, id: friend.friendId }, true);
        }
      });

      await Promise.all(userPromises);

      if (friends.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('dbSearchFriends: ' + error);
      return false;
    }
  };

  const showFriendRequests = async (friendInfo, friendRequestId) => {
    try {
      const userDiv = document.createElement('div');
      userDiv.className = 'profile-container';

      userDiv.innerHTML = `
        <div class="container-icon">
          <img id="small-pfp" src="${friendInfo.avatarURL}" style="user-select: none" />
        </div>
      <h1>${friendInfo.username}</h1>
      <div class="container-buttons">
        <div class="container-button accept" id="accept-${friendInfo.id}">
          <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#cbd5e1"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
        </div>
        <div class="container-button reject" id="reject-${friendInfo.id}">
          <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#cbd5e1"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
        </div>
      </div>
        `;
      friendLV.appendChild(userDiv);
      // Add event listeners for accept/reject
      const acceptButton = document.getElementById(`accept-${friendInfo.id}`);
      const rejectButton = document.getElementById(`reject-${friendInfo.id}`);
      acceptButton.addEventListener('click', () => handleRequest(true, friendRequestId));
      rejectButton.addEventListener('click', () => handleRequest(false, friendRequestId));
    } catch (error) {
      console.error('showFriendRequests ' + error);
    }
  };
  const handleRequest = async (didUserAccept, friendRequestId) => {
    console.log('friendRequestId: ' + friendRequestId);

    const docRef = doc(db, 'friends', friendRequestId);
    if (didUserAccept) {
      const updatedData = {
        status: 'accepted'
      };
      await updateDoc(docRef, updatedData);
      console.log('req accepted');
    } else if (!didUserAccept) {
      const updatedData = {
        status: 'declined'
      };
      await updateDoc(docRef, updatedData);
      console.log('req declined');
    }
    // Default view

    searchFriends();
  };
  const deleteFriendship = async (currentUserId, friendUserId) => {
    console.log(`Trying to delete friendship between user1: ${currentUserId}, user2: ${friendUserId}`);

    try {
      // Query to find the friendship document
      const q = query(
        collection(db, 'friends'),
        where('userId1', '==', currentUserId),
        where('userId2', '==', friendUserId),
        where('status', '==', 'accepted')
      );

      const querySnapshot = await getDocs(q);

      // Deleting each matching document (there should ideally be only one)
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        console.log(`Friendship document with ID ${doc.id} deleted.`);
      });

      // Refresh the default friends list view
      searchFriends();
    } catch (error) {
      console.error('Error deleting friendship:', error);
    }
  };
  const sendFriendRequest = async (currentUserId, friendUserId) => {
    console.log(`trying friend request with:user1: ${currentUserId}, user2: ${friendUserId}`);
    const customDocId = generateCustomId();
    const docRef = doc(db, 'friends', customDocId);

    try {
      const friendRequest = await setDoc(docRef, {
        userId1: currentUserId,
        userId2: friendUserId,
        status: 'pending'
      });
      console.log('Friend request made:', customDocId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  searchFriends();
  searchIcon.addEventListener('click', searchFriends);
  searchBar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchFriends(event);
    }
  });
}

function handleImageSelect() {
  const imageInput = document.getElementById('image-input');
  const labelProfilePicture = document.getElementById('labelProfilePicture');

  imageInput.addEventListener('change', function (e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const file = imageInput.files[0];

      if (file) {
        // Create a FileReader to read the file
        const reader = new FileReader();

        // Define the onload callback to get the base64 string
        reader.onload = (e) => {
          // Create an image element to hold the original image
          const img = new Image();

          // Set the image src to the data URL read from the file
          img.src = e.target.result;
          // Create a canvas to draw the resized image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set the canvas dimensions to 150x150
          canvas.width = 150;
          canvas.height = 150;

          // Define the onload callback for the image
          img.onload = () => {
            // Draw the resized image on the canvas
            ctx.drawImage(img, 0, 0, 150, 150);

            // Get the Base64 string of the resized image
            base64String = canvas.toDataURL('image/png');

            // Display the Base64 string
            console.log('base64 in variable: ' + base64String.substring(0, 20) + '...');

            labelProfilePicture.textContent = 'Profile Picture (Image Selected)';
          };
        };

        // Read the file as a data URL
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

async function saveChanges(event) {
  event.preventDefault();
  event.stopPropagation();

  const popup = document.getElementById('my-popup');
  const backdrop = document.getElementById('backdrop');

  // Prepare for edit changes
  const titleInput = document.getElementById('pop-titleInput');
  const textInput = document.getElementById('pop-textInput');
  const dreamCategory = document.getElementById('pop-dream-category');
  const starCategory = document.getElementById('pop-star-category');

  try {
    const updatedData = {
      title: titleInput.value,
      text: textInput.value,
      category: dreamCategory.value,
      stars: starCategory.value
    };

    const docRef = doc(db, 'entries', currentSelectedEntry.id); // Reference to the specific document
    await updateDoc(docRef, updatedData); // Perform the update
    console.log('Document updated successfully:', currentSelectedEntry.id);

    popup.style.display = 'none';
    backdrop.style.display = 'none';
    // Refresh listview
    setListViewContent();
  } catch (error) {
    console.error('Error updating Firestore document:', error);
  }
}

// Handle Functions
function handleEditSvg(editButton, itemInfo) {
  const popup = document.getElementById('my-popup');
  const backgroundBlur = document.getElementById('backdrop'); // add cool blur

  const titleInput = document.getElementById('pop-titleInput');
  const textInput = document.getElementById('pop-textInput');
  const dreamCategory = document.getElementById('pop-dream-category');
  const starCategory = document.getElementById('pop-star-category');

  // Function to toggle the popup visibility
  const togglePopup = (event) => {
    event.stopPropagation(); // Prevent click event from bubbling up

    // Set iteminfo to inputs
    titleInput.value = itemInfo.title;
    textInput.value = itemInfo.text;
    dreamCategory.value = itemInfo.category;
    starCategory.value = itemInfo.stars;

    // Display Toggle
    popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
    backgroundBlur.style.display = backgroundBlur.style.display === 'block' ? 'none' : 'block';

    currentSelectedEntry = itemInfo;
    console.log(itemInfo.id);
  };

  // Function to hide the popup
  const hidePopup = (event) => {
    if (!popup.contains(event.target) && !editButton.contains(event.target)) {
      popup.style.display = 'none';
      backgroundBlur.style.display = 'none';
    }
  };

  editButton.addEventListener('click', togglePopup); // Event listener for the icon click
  document.addEventListener('click', hidePopup); // Event listener for clicks outside the popup
}

async function handleDeleteSvg(button, itemInfo) {
  const deleteItem = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Ask if user wants to delete
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this imaginary file!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(async (result) => {
      // User clicked "Yes, delete it!"
      if (result.isConfirmed) {
        await deleteDoc(doc(db, 'entries', itemInfo.id));
        console.log('refresh list');

        await setListViewContent(); // update listview
      }
    });
  };
  button.addEventListener('click', deleteItem);
}

function handleSettingsSaveButton(button) {
  button.addEventListener('click', async function (event) {
    event.preventDefault();

    const usernameField = document.getElementById('usernameInput').value;
    const accentColor = document.getElementById('secondary-color').value;
    const accentColorDark = document.getElementById('secondary-color-dark').value;

    try {
      const userRef = doc(db, 'users', currentUser.uid);

      // Fetch current user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Prepare update object
      const updateData = {
        username: usernameField,
        accentColor: accentColor,
        accentColorDark: accentColorDark
      };

      // Only update avatarURL if a new image has been selected
      if (base64String) {
        console.log('base64 added to updatedData: ' + base64String.substring(0, 20) + '...');
        updateData.avatarURL = base64String;
      }

      await updateDoc(userRef, updateData);
      // window.location.href = 'profile.html';
    } catch (error) {
      console.error('db update error: ' + error);
    }
  });
}

function handleLoginButton(button) {
  console.log('login button loaded');
  button.addEventListener('click', function (event) {
    event.preventDefault();

    const email = document.getElementById('emailField').value;
    const password = document.getElementById('passwordField').value;

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        console.log('User signed in:', userCredential.user);
        // window.location.href = '/profile.html';
        console.log('navigate to profile');
      })
      .catch((error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error signing in!',
          text: `${error.message}, check details!`,
          icon: 'error',
          confirmButtonText: 'Ok',
          background: '#f9f9f9',
          confirmButtonColor: '#3085d6',
          buttonsStyling: true
        });
      });
  });
}

function createSearchTokens(username) {
  const tokens = [];
  const lowerCaseUsername = username.toLowerCase();
  const words = lowerCaseUsername.split(' ');

  words.forEach((word) => {
    let partial = '';
    for (let char of word) {
      partial += char;
      tokens.push(partial);
    }
  });

  return tokens;
}
function getCurrentDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  return dateStr;
}

function handleRegisterButton(button) {
  button.addEventListener('click', function (event) {
    event.preventDefault();
    const emailValue = document.getElementById('emailField').value;
    const usernameValue = document.getElementById('usernameField').value;
    const password = document.getElementById('passwordField').value;
    const passwordCheck = document.getElementById('passwordCheckField').value;
    const passwordCheckResult = validateForm(emailValue, usernameValue, password, passwordCheck);

    if (passwordCheckResult === 'Valid password.') {
      // Create tokens for username for easy search in friends tab
      const searchTokens = createSearchTokens(usernameValue);

      // Register user to db
      createUserWithEmailAndPassword(auth, emailValue, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const joinedDate = getCurrentDate();
          await setDoc(doc(db, 'users', user.uid), {
            avatarURL: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
            email: emailValue,
            username: usernameValue,
            searchTokens: searchTokens,
            accentColor: '#e869bd',
            accentColorDark: '#6f0166',
            joined: joinedDate
          });
          // window.location.href = '/profile.html';
        })
        .catch((error) => {
          Swal.fire({
            title: 'Error registering!',
            text: `${error.message}, check details!, ${passwordCheckResult}`,
            icon: 'error',
            confirmButtonText: 'Ok',
            background: '#f9f9f9',
            confirmButtonColor: '#3085d6',
            buttonsStyling: true
          });
        });
    } else {
      Swal.fire({
        title: 'Error!',
        text: passwordCheckResult,
        icon: 'error',
        confirmButtonText: 'Ok',
        background: '#f9f9f9',
        confirmButtonColor: '#3085d6',
        buttonsStyling: true
      });
    }
  });
}

function handleSaveButton(button) {
  button.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const journalEntry = JournalEntry.journalMain();
    const customDocId = generateCustomId();
    const docRef = doc(db, 'entries', customDocId);

    try {
      await setDoc(docRef, journalEntry.toFirestore());
      console.log('Document written with ID: ', customDocId);
      //update Listview
      setListViewContent();
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  });
}

function validateForm(emailValue, usernameValue, password, passwordCheck) {
  if (password === '' || passwordCheck === '' || emailValue === '' || usernameValue === '') {
    return 'Inputfields cannot be empty.';
  } else if (password !== passwordCheck) {
    return 'Passwords do not match.';
  } else {
    return 'Valid password.';
  }
}

// Journal class
class JournalEntry {
  constructor(title, text, stars, category, date, userID) {
    this.title = title;
    this.text = text;
    this.stars = stars;
    this.category = category;
    this.date = date;
    this.userID = userID;
  }

  static journalMain() {
    //read values
    var titleValue = document.getElementById('titleInput').value;
    var textValue = document.getElementById('textInput').value;

    if (titleValue === '') {
      titleValue = 'untitled';
    }
    if (textValue === '') {
      textValue = '-';
    }

    const starCategory = document.getElementById('star-category');
    const selectedStarValue = starCategory && starCategory.value !== '' ? starCategory.value : 'unrated';
    console.log(selectedStarValue);

    const categorySelect = document.getElementById('dream-category');
    const categoryValue = categorySelect && categorySelect.value !== '' ? categorySelect.value : 'none';
    console.log(categoryValue);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');

    const dateValue = `${day}-${month}-${year}`;
    const userIDValue = currentUser.uid;

    return new JournalEntry(titleValue, textValue, selectedStarValue, categoryValue, dateValue, userIDValue);
  }

  toFirestore() {
    return {
      title: this.title,
      text: this.text,
      stars: this.stars,
      category: this.category,
      date: this.date,
      userID: this.userID
    };
  }
}

function generateCustomId() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  const dateStr = `${year}${month}${day}`;
  const uniquePart = nanoid(10); // Generate a 10-character nanoid
  return `${dateStr}_${uniquePart}`;
}

// async function aiQuery(data) {
//   try {
//     const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
//       headers: {
//         Authorization: 'Bearer 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',
//         'Content-Type': 'application/json'
//       },
//       method: 'POST',
//       body: JSON.stringify(data)
//     });

//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }

//     // Handle different response types
//     const contentType = response.headers.get('Content-Type');
//     if (contentType && contentType.indexOf('application/json') !== -1) {
//       const result = await response.json();
//       return result;
//     } else {
//       const blobResult = await response.blob();
//       return blobResult;
//     }
//   } catch (error) {
//     console.error('Error during API call:', error);
//     return null;
//   }
// }

// aiQuery({ inputs: 'Astronaut riding a horse' }).then((response) => {
//   const aiImage = document.getElementById('ai-image');
//   if (response) {
//     if (response instanceof Blob) {
//       const imageUrl = URL.createObjectURL(response);
//       aiImage.src = imageUrl;
//     } else {
//       console.log('Received JSON response:', response);
//       // Handle JSON response if necessary
//     }
//   } else {
//     console.log('No response or error occurred');
//   }
// });
