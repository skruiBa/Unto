//src/firebase/firestore.js

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
import { app } from './firebase-config';

const db = getFirestore(app);
export { db };
