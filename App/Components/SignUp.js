import React, { Component } from 'react';
import {
  View, Text, Alert, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { Actions } from 'react-native-router-flux';

import { User } from '../Models';
import Button from './Common/Button';


class SignUp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      password: '',
      name: '',
      signingUp: false,
    };
  }

  handleSubmit() {
    const { email, password, name } = this.state;

    if (email !== '' && password !== '' && name !== '') {
      this.setState({ signingUp: true });
      User.signUpWithEmail({
        data: { email, password, name },
        onSuccess: () => {
          this.setState({ signingUp: false });
          Actions.Home();
        },
        onError: (data) => {
          Alert.alert(
            'Signup Error',
            data.message,
            [
              { text: 'Ask me later', onPress: () => { /* console.log('Ask me later pressed') */ } },
              { text: 'Cancel', onPress: () => { /* console.log('Cancel Pressed') */ }, style: 'cancel' },
              { text: 'OK', onPress: () => { /* console.log('OK Pressed') */ } },
            ],
            { cancelable: false },
          );
        },
      });
    }
  }

  render() {
    return (
      <ScrollView style={styles.mainContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hello!</Text>
          <Text style={styles.welcomeSubText}>Welcome to Atudo!</Text>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Signup to continue</Text>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>NAME</Text>
            <TextInput
              style={styles.textInput}
              underlineColorAndroid="transparent"
              onChange={event => this.setState({
                name: event.nativeEvent.text,
              })}
            />
          </View>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>E-MAIL</Text>
            <TextInput
              style={styles.textInput}
              underlineColorAndroid="transparent"
              onChange={event => this.setState({
                email: event.nativeEvent.text,
              })}
            />
          </View>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.textInput}
              underlineColorAndroid="transparent"
              secureTextEntry
              onChange={event => this.setState({
                password: event.nativeEvent.text,
              })}
            />
          </View>
          <Button
            onPress={() => this.handleSubmit()}
            loading={this.state.signingUp}
            message="SIGN UP"
          />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 35,
    paddingTop: 50,
    flexDirection: 'column',
  },
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
  textInputContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: '#9146A7',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 18,
    height: 40,
  },
  textInputLabel: {
    fontWeight: '200',
    paddingBottom: 10,
  },
  submitButton: {
    backgroundColor: '#9146A7',
    height: 40,
    marginTop: 20,
    marginLeft: 30,
    marginRight: 30,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});


export default SignUp;
