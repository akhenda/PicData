import * as User from './User';
import { Firebase } from '../Lib';

function getCategories(options) {
  User.isUserSignedIn({
    onSuccess: (data) => {
      if (data.authenticated) {
        const userKey = Firebase.auth().currentUser.uid;
        Firebase.database().ref(`users/${userKey}`).once('value').then((snapshot) => {
          const user = snapshot.val();
          user.uid = userKey;
          Firebase.database().ref('categories').once('value').then((snap1) => {
            if (snap1 != null) {
              Firebase.database().ref('sub-categories').once('value').then((snap2) => {
                if (snap2 != null) {
                  options.onSuccess({
                    user,
                    categories: snap1.val(),
                    subcategories: snap2.val(),
                  });
                } else {
                  options.onError({ message: 'This project has no sub-categories!' });
                }
              });
            } else {
              options.onError({ message: 'This project has no categories!' });
            }
          });
        });
      } else {
        options.onError({ message: 'You need to log in to use these services.' });
      }
    },
    onError: (error) => {
      options.onError({ message: error.message });
    },
  });
}


export {
  getCategories,
};
