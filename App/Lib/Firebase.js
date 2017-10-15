import firebase from 'react-native-firebase';
import { FirebaseKeys } from '../Config';
// import * as Firebase from "firebase";

const config = {
  apiKey: FirebaseKeys.FIREBASE_API_KEY,
  authDomain: FirebaseKeys.AUTH_DOMAIN,
  databaseURL: FirebaseKeys.DATABASE_URL,
  storageBucket: FirebaseKeys.STORAGE_BUCKET,
  messagingSenderId: FirebaseKeys.MESSAGING_SENDER_ID,
};

firebase.initializeApp(config);

const Firebase = firebase;

export default Firebase;
