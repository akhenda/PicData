import { Firebase } from '../Lib';


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
        switch (snapshot.state) {
          case Firebase.storage.TaskState.PAUSED: // or 'paused'
            break;
          case Firebase.storage.TaskState.RUNNING: // or 'running'
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
        const url = snapshot.downloadURL;
        submissionData.image_url = url;
        Firebase.database().ref().child('submissions').push(submissionData)
          .then((data) => {
            options.onSuccess({ data });
          });
      });
  } else {
    Firebase.database().ref().child('submissions').push(submissionData)
      .then((data) => {
        options.onSuccess({ data });
      });
  }
}

export {
  submitItem,
};
