import RNFetchBlob from 'react-native-fetch-blob';
import { Firebase } from '../Lib';

const { polyfill } = RNFetchBlob;
// const storageRef = Firebase.storage().ref('images');
// window.Blob = polyfill.Blob


function submitItem(options) {
  const submissionData = options.data;
  const { file } = options;
  if (file) {
    const fileName = `${String(new Date().getTime())}-${submissionData.sender_id}`;
    Firebase.storage()
      .ref(`/images/${fileName}.jpg`)
      .putFile(file.path, { contentType: 'image/jpeg' })
      .on('state_changed', (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the
        // total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        options.onProgress(progress);
        // console.log(`Upload is ${progress}% done`);
        switch (snapshot.state) {
          case Firebase.storage.TaskState.PAUSED: // or 'paused'
            // console.log('Upload is paused');
            break;
          case Firebase.storage.TaskState.RUNNING: // or 'running'
            // console.log('Upload is running');
            break;
          default:
            break;
        }
      }, (error) => {
        // Handle unsuccessful uploads
        options.onError(error);
      }, (snapshot) => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        // console.log('snapshot: ', snapshot);
        const url = snapshot.downloadURL;
        submissionData.image_url = url;
        Firebase.database().ref().child('submissions').push(submissionData)
          .then((data) => {
            options.onSuccess();
          });
      });
  } else {
    Firebase.database().ref().child('submissions').push(submissionData)
      .then((data) => {
        options.onSuccess();
      });
  }
}

export {
  submitItem,
};
