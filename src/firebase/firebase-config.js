//src/firebase/firebase-config.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBiscdF0tuWqOHERdRQdNlkvbQsmClDLbo',
  authDomain: 'dreamlog-7dff3.firebaseapp.com',
  databaseURL: 'https://dreamlog-7dff3-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dreamlog-7dff3',
  storageBucket: 'dreamlog-7dff3.appspot.com',
  messagingSenderId: '5989316723',
  appId: '1:5989316723:web:72539d64015f7a5f8cd206',
  measurementId: 'G-F1V81KG437'
};

const app = initializeApp(firebaseConfig);
export { app };
