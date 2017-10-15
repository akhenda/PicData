import Config from 'react-native-config';
import firebase from 'react-native-firebase';

const config = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.AUTH_DOMAIN,
  databaseURL: Config.DATABASE_URL,
  storageBucket: Config.STORAGE_BUCKET,
  messagingSenderId: Config.MESSAGING_SENDER_ID,
};

firebase.initializeApp(config);

const Firebase = firebase;

export default Firebase;
