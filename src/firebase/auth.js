// src/firebase/auth.js
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { app } from './firebase-config';

const auth = getAuth(app);
export { auth };
