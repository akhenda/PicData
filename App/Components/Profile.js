import React, { Component } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  ScrollView,
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
      updateProfile: false,
    };
  }

  componentWillMount() {
    User.isUserSignedIn({
      onSuccess: (data) => {
        this.setState({
          email: data.user.email,
          name: data.user.name || data.user.displayName,
        });
      },
      onError: (error) => {
        this.setState({
          email: '',
          password: '',
          name: '',
          updateProfile: false,
        });
        this.commDialog('Error', error.message);
      },
    });
  }

  componentDidMount() {
    const { email, name } = this.state;

    if (email && name) {
      Actions.Home({ type: 'replace' });
    }
  }

  commDialog(title, message) {
    return Alert.alert(
      title,
      message,
      [
        { text: 'Ask me later', onPress: () => null },
        { text: 'Cancel', onPress: () => null, style: 'cancel' },
        { text: 'OK', onPress: () => null },
      ],
      { cancelable: false },
    );
  }

  handleSubmit() {
    const { email, password, name } = this.state;

    if (email !== '' && password !== '' && name !== '') {
      this.setState({ updateProfile: true });
      User.updateUserInfo({
        data: { email, password, name },
        onSuccess: () => {
          this.setState({ updateProfile: false });
          Actions.Home();
        },
        onError: (error) => {
          this.commDialog('Error', error.message);
        },
      });
    }
  }

  render() {
    const { email, name, password } = this.state;
    return (
      <ScrollView style={styles.mainContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>PicData</Text>
          <Text style={styles.welcomeSubText}>You are one step away</Text>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Please update your profile to continue</Text>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>NAME</Text>
            <TextInput
              underlineColorAndroid="transparent"
              style={styles.textInput}
              placeholder="Your full name"
              onChangeText={value => this.setState({ name: value })}
              value={name}
            />
          </View>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>E-MAIL</Text>
            <TextInput
              keyboardType="email-address"
              underlineColorAndroid="transparent"
              style={styles.textInput}
              placeholder="jonh@doe.com"
              onChangeText={value => this.setState({ email: value })}
              value={email}
            />
          </View>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>PASSWORD</Text>
            <TextInput
              secureTextEntry
              underlineColorAndroid="transparent"
              style={styles.textInput}
              placeholder="Your password"
              onChangeText={value => this.setState({ password: value })}
              value={password}
            />
          </View>
          <Button
            onPress={() => this.handleSubmit()}
            loading={this.state.updateProfile}
            message="SAVE PROFILE"
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
