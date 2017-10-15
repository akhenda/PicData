import moment from 'moment';
import { ToastAndroid } from 'react-native';
import firebase from 'react-native-firebase';

import { Firebase } from '../Lib';

const FBSDK = require('react-native-fbsdk');

const {
  AccessToken,
  GraphRequest,
  LoginManager,
  GraphRequestManager,
} = FBSDK;


function getTodaysKey() {
  const dateKey = moment().format('MM-D-YY');
  return dateKey;
}

function isUserSignedIn(options) {
  Firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      options.onSuccess({ user, authenticated: true });
    } else {
      options.onError({ authenticated: false, message: 'Login to continue' });
    }
  });
}

function loginUser(user) {
  Firebase.database().ref(`/users/${user.uid}`).once('value').then((snapshot) => {
    if (snapshot.val() !== null) {
      const userProfile = snapshot.val().profile;
      userProfile.id = user.uid;
    }
  });
  return true;
}

function signUpWithEmail(options) {
  Firebase
    .auth()
    .createUserWithEmailAndPassword(options.data.email, options.data.password)
    .then(
      user => this.saveUser(user, options),
      (error) => {
        const errorMessage = error.message;
        options.onError({ message: errorMessage });
      },
    );
}

function signInWithEmail(options) {
  Firebase.auth()
    .signInWithEmailAndPassword(options.data.email, options.data.password)
    .then(
      () => {
        const user = Firebase.auth().currentUser;
        options.onSuccess({ user });
      },
      (error) => {
        const errorMessage = error.message;
        options.onError({ message: errorMessage });
      },
    );
}

function signInWithPhone(options) {
  const { phoneNumber } = options.data;

  firebase.auth().signInWithPhoneNumber(phoneNumber)
    .then((confirmResult) => {
      options.onSuccess({ confirmResult });
    })
    .catch((error) => {
      options.onError({ message: error.message });
    });
}

function saveUser(user, options) {
  const userData = {
    email: user.email,
    name: options.data.name || user.name,
  };
  Firebase.database().ref(`/users/${user.uid}`).set(userData)
    .then(() => {
      options.onSuccess({ user });
    })
    .catch(error => options.onError({ message: error.message }));
}

function logoutUser(options) {
  Firebase.auth().signOut().then(() => {
    // Sign-out successful.
    options.onSuccess({ loggedOut: true, message: 'You have been logged out' });
  }, (error) => {
    // An error happened.
    options.onError({ message: error.message });
  });
}

function sendPasswordResetEmail(options) {
  Firebase.auth().sendPasswordResetEmail(options.email).then(() => {
    options.onSuccess(true);
  });
}

function isCheckedIn(options) {
  const dateKey = getTodaysKey();

  isUserSignedIn({
    onSuccess: (data) => {
      if (data.authenticated) {
        const userKey = data.user.uid;
        Firebase.database().ref(`checkins/${dateKey}/${userKey}`).once('value').then((snap) => {
          if (snap !== null) {
            options.onSuccess({ user_id: userKey, checkedIn: snap.val() });
          } else {
            options.onSuccess({ user_id: userKey, checkedIn: false });
          }
        });
      } else {
        options.onSuccess({ checkedIn: false });
      }
    },
    onError: (error) => {
      options.onError({ message: error.message });
    },
  });
}

function checkIn(options) {
  const dateKey = getTodaysKey();
  isUserSignedIn({
    onSuccess: (data) => {
      if (data.authenticated) {
        const checkinInfo = {};
        checkinInfo[data.user.uid] = true;
        Firebase.database().ref(`checkins/${dateKey}`).update(checkinInfo).then(() => {
          options.onSuccess({ checkedIn: true });
        });
      }
    },
    onError: (error) => {
      options.onError({ message: error.message });
    },
  });
}

function getCheckIns(options) {
  const dateKey = getTodaysKey();
  Firebase.database().ref(`checkins/${dateKey}`).on('child_added', (snap) => {
    const userKey = snap.key;
    Firebase.database().ref(`users/${userKey}`).once('value').then((snapshot) => {
      const user = snapshot.val();
      user.id = snapshot.key;
      options.onSuccess({ user });
    });
  });
}

function getFacebookUserInfo(options) {
  const req = new GraphRequest('/me', {
    httpMethod: 'GET',
    version: 'v2.5',
    parameters: {
      fields: {
        string: 'name,email',
      },
    },
  }, (err, res) => {
    options.onSuccess({ user: res });
  });

  new GraphRequestManager().addRequest(req).start();
}

function handleFirebaseLogin(accessToken, user, options) {
  Firebase.auth()
    .signInWithCredential(accessToken)
    .then((data) => {
      const userData = {
        name: user.name,
        email: user.email || '',
      };
      Firebase.database().ref(`users/${data.uid}`).set(userData).then(() => {
        options.onSuccess({ user });
      });
    })
    .catch((error) => {
      options.onError({ message: error.message });
    });
}

function facebookLogin(options) {
  if (options) {
    LoginManager.logInWithReadPermissions(['public_profile', 'email']).then((result) => {
      if (result.isCancelled) {
        ToastAndroid.show('Login cancelled!', ToastAndroid.SHORT);
        options.onError({ message: 'Login cancelled!' });
      } else {
        AccessToken.getCurrentAccessToken().then((data) => {
          const accessToken = Firebase.auth.FacebookAuthProvider.credential(data.accessToken);
          getFacebookUserInfo({
            data: {
              accessToken: data.accessToken,
            },
            onSuccess: (extraData) => {
              const { user } = extraData;
              handleFirebaseLogin(accessToken, user, options);
            },
          });
        });
      }
    });
  }
}

function updateUserInfo(options) {
  const user = firebase.auth().currentUser;
  if (options) {
    user.updateEmail(options.data.email)
      .then(() => {
        user.updateProfile({ displayName: options.data.name, photoUrl: '' })
          .then(() => {
            user.updatePassword(options.data.password)
              .then((data) => {
                const userData = {
                  email: data.email,
                  name: options.data.name,
                };
                Firebase.database().ref(`/users/${user.uid}`).set(userData).then(() => {
                  options.onSuccess();
                });
              })
              .catch((extraError) => {
                options.onError({ extraError });
              });
          })
          .catch((anotherError) => {
            options.onError({ anotherError });
          });
      })
      .catch((error) => {
        options.onError({ error });
      });
  }
}

export {
  isUserSignedIn,
  loginUser,
  logoutUser,
  facebookLogin,
  signUpWithEmail,
  signInWithEmail,
  signInWithPhone,
  sendPasswordResetEmail,
  saveUser,
  checkIn,
  isCheckedIn,
  getCheckIns,
  updateUserInfo,
};
