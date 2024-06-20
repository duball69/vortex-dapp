// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "lp-provider-dapp.firebaseapp.com",
  projectId: "lp-provider-dapp",
  storageBucket: "lp-provider-dapp.appspot.com",
  messagingSenderId: "286200559608",
  appId: "1:286200559608:web:0560232928b45385db480d",
  measurementId: "G-6YPSXCDPGW",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app); // Initialize Firestore

export { app, firestore };
