import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Importa getFirestore
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBBwrkmBi2YjWa2wm2s-YJcfVSgtrPNSw0",
  authDomain: "tarija-city-6b32e.firebaseapp.com",
  projectId: "tarija-city-6b32e",
  storageBucket: "tarija-city-6b32e.appspot.com",
  messagingSenderId: "843581215073",
  appId: "1:843581215073:web:46ee92d1b3380186c4b520"
};

export const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia para React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app); 