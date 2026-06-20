import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDPncZ0tmFHec8kJjQYBBMHu0y6C4yRiHU",
  authDomain: "idiom-quiz-king.firebaseapp.com",
  projectId: "idiom-quiz-king",
  storageBucket: "idiom-quiz-king.firebasestorage.app",
  messagingSenderId: "390991980182",
  appId: "1:390991980182:web:07a909ba41e67c1b8b44b7",
  measurementId: "G-G26KSJ9SNG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export
export const db = getDatabase(app);
export default app;
