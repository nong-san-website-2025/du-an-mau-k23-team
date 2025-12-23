import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgfYVycQGB4qyL4x8rtAP1G8tAVDe1xVA",
  authDomain: "grenfarm-bb091.firebaseapp.com",
  projectId: "grenfarm-bb091",
  storageBucket: "grenfarm-bb091.firebasestorage.app",
  messagingSenderId: "1051233561012",
  appId: "1:1051233561012:web:74b3a5ec63678873692ae1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "vi";