// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyB4Dqv6NMWScbqho8F7PYNjH-u0egGYpWA",
   authDomain: "app-rutas-fb36d.firebaseapp.com",
   projectId: "app-rutas-fb36d",
   storageBucket: "app-rutas-fb36d.firebasestorage.app",
   messagingSenderId: "170674374323",
   appId: "1:170674374323:web:2ed297469f90544c3192c6",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
   persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
