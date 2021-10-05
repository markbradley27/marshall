import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "marshall-d574a.firebaseapp.com",
  projectId: "marshall-d574a",
  storageBucket: "marshall-d574a.appspot.com",
  messagingSenderId: "441621754616",
  appId: "1:441621754616:web:29d6cc1498a499db9f810d",
  measurementId: "G-FHQLR692N1",
};

initializeApp(firebaseConfig);
