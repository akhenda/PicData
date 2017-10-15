import React, { Component } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
  BackHandler,
  TouchableHighlight,
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import { User } from '../Models';
import { CommonStyle } from '../Styles';
import Button from './Common/Button';


class Login extends Component {
  constructor(props) {
    super(props);
    this.unsubscribe = null;
    this.state = {
      user: null,
      message: 'Login to continue',
      codeInput: '',
      phoneNumber: '+254',
      confirmResult: null,
      loggingIn: false,
      facebookLoggingIn: false,
    };
  }

  componentDidMount() {
    this.ismounted = true;
    this.unsubscribe = User.isUserSignedIn({
      onSuccess: (data) => {
        // console.log('Unsubscribe Data:', data);
        if (this.ismounted) this.setState({ user: data.user });
      },
      onError: (error) => {
        // User has been signed out, reset the state
        if (this.ismounted) {
          this.setState({
            user: null,
            message: error.message,
            codeInput: '',
            phoneNumber: '+254',
            confirmResult: null,
            loggingIn: false,
            facebookLoggingIn: false,
            confirmingCode: false,
            resendingCode: false,
          });
        }
      },
    });

    BackHandler.addEventListener('hardwareBackPress', () => this.backAndroid());
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.user !== prevState.user) {
      this.goToHomeOrProfile(this.state.user);
    }
  }

  componentWillUnmount() {
    this.ismounted = false;
    if (this.unsubscribe) this.unsubscribe();
    BackHandler.removeEventListener('hardwareBackPress', () => this.backAndroid());
  }
  
  backAndroid() {
    BackHandler.exitApp();
    return false;
  }

  /* eslint-disable class-methods-use-this */
  goToSignUp() {
    Actions.SignUp();
  }

  goToHomeOrProfile(user) {
    const { email } = user;
    const name = user.name || user.displayName;

    if (email && name) {
      return Actions.Home({ type: 'replace' });
    }
    return Actions.Profile({ type: 'replace' });
  }

  commDialog(title, message) {
    return Alert.alert(
      title,
      message,
      [
        { text: 'Ask me later', onPress: () => { /* console.log('Ask me later pressed') */ } },
        { text: 'Cancel', onPress: () => { /* console.log('Cancel Pressed') */ }, style: 'cancel' },
        { text: 'OK', onPress: () => { /* console.log('OK Pressed') */ } },
      ],
      { cancelable: false },
    );
  }

  handleSubmit(resending=false) {
    const phoneNumber = this.state.phoneNumber.trim();

    if (phoneNumber !== '') {
      this.setState({ loggingIn: !resending, resendingCode: resending });
      User.signInWithPhone({
        data: { phoneNumber },
        onSuccess: (data) => {
          if (this.ismounted) {
            this.setState({
              loggingIn: resending ? !resending : resending,
              resendingCode: resending ? !resending : resending,
              confirmResult: data.confirmResult,
              message: 'Verify your number to continue',
            });
          }
        },
        onError: (data) => {
          this.setState({
            loggingIn: resending ? !resending : resending,
            resendingCode: resending ? !resending : resending,
            message: data.message,
          });
          this.commDialog('Login Error', data.message);
        },
      });
    }
  }

  confirmCode() {
    const { codeInput, confirmResult } = this.state;
    this.setState({ confirmingCode: true });

    if (confirmResult && codeInput.length) {
      confirmResult.confirm(codeInput)
        .then((confirmedUser) => {
          User.saveUser(confirmedUser, {
            onSuccess: ({ user }) => {
              this.setState({
                user,
                message: 'Code Confirmed!',
                confirmingCode: false,
              });
            },
            onError: ({ message }) => {
              this.setState({
                message,
                confirmingCode: false,
              });
            },
          });
          // console.log('User wa Phone:', confirmedUser);
        })
        .catch(error => this.setState({
          message: `Code Confirm Error: ${error.message}`,
          confirmingCode: false,
        }));
    }
  }

  /**
  * Handles Facebook Login
  */
  handleFacebookLogin() {
    this.setState({ facebookLoggingIn: true });

    User.facebookLogin({
      data: true,
      onSuccess: () => {
        // console.log('handleFacebookLogin user: ', user);
        // this.setState({ user, facebookLoggingIn: false });
      },
      onError: () => {
        // this.setState({ facebookLoggingIn: false });
        this.commDialog('Facebook Login', 'Login Failed');
      },
    });
  }

  renderPhoneNumberInput() {
    const { phoneNumber } = this.state;

    return (
      <View style={CommonStyle.textInputContainer}>
        <Text style={CommonStyle.textInputLabel}>Enter phone number:</Text>
        <TextInput
          keyboardType="phone-pad"
          underlineColorAndroid="transparent"
          style={CommonStyle.textInput}
          placeholder="Phone Number..."
          onChangeText={value => this.setState({ phoneNumber: value })}
          value={phoneNumber}
        />
      </View>
    );
  }

  renderMessage() {
    const { message } = this.state;

    // if (!!message.length) return null;

    return (
      <Text style={styles.formTitle}>{message}</Text>
    );
  }

  renderVerificationCodeInput() {
    const { codeInput } = this.state;

    return (
      <View style={CommonStyle.textInputContainer}>
        <Text style={CommonStyle.textInputLabel}>Enter verification code below:</Text>
        <TextInput
          autoFocus
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          style={CommonStyle.textInput}
          placeholder="Verification Code..."
          onChangeText={value => this.setState({ codeInput: value })}
          value={codeInput}
        />
      </View>
    );
  }

  render() {
    const {
      user,
      loggingIn,
      confirmResult,
      resendingCode,
      confirmingCode,
      facebookLoggingIn,
    } = this.state;

    return (
      <View style={styles.mainContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello</Text>
          <Text style={styles.welcomeSubText}>Welcome to PicData</Text>
        </View>
        <ScrollView style={styles.formContainer}>
          {this.renderMessage()}
          {!user && !confirmResult && this.renderPhoneNumberInput()}
          {!user && confirmResult && this.renderVerificationCodeInput()}
          <Button
            onPress={
              !user && !confirmResult ?
              () => this.handleSubmit() :
              () => this.confirmCode()
            }
            loading={!user && !confirmResult ? loggingIn : confirmingCode}
            message={!user && !confirmResult ? 'LOGIN' : 'CONFIRM CODE'}
          />
          <Button
            onPress={
              !user && !confirmResult ?
              () => this.handleFacebookLogin() :
              () => this.handleSubmit(true)
            }
            loading={!user && !confirmResult ? facebookLoggingIn : resendingCode}
            message={!user && !confirmResult ? 'LOGIN WITH FACEBOOK' : 'RESEND CODE'}
          />
          <TouchableHighlight
            underlayColor="#DCDCDC"
            onPress={() => BackHandler.exitApp()}
            style={styles.exitButton}
          >
            <Text style={styles.signUpButtonText}>EXIT</Text>
          </TouchableHighlight>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 35,
    paddingTop: 100,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  // mainContentContainer: {
  //   flexDirection: 'column',
  //   justifyContent: 'space-around',
  // },
  formTitle: {
    fontSize: 20,
    fontWeight: '200',
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: '400',
    paddingBottom: 20,
  },
  welcomeSubText: {
    fontSize: 20,
    fontWeight: '200',
    paddingBottom: 20,
  },
  signUpButton: {
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#9146A7',
    textAlign: 'center',
  },
  exitButton: {
    padding: 8,
    marginTop: 30,
  },
});


export default Login;
