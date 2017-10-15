/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { StyleSheet, AppRegistry, ActivityIndicator, BackHandler } from 'react-native';

import { Scene, Router } from 'react-native-router-flux';
import FCM, { FCMEvent } from 'react-native-fcm';
import RNExitApp from 'react-native-exit-app';

import { User } from './App/Models';
import Home from './App/Components/Home';
import Login from './App/Components/Login';
import Profile from './App/Components/Profile';
import SignUp from './App/Components/SignUp';
import Messenger from './App/Components/Messenger';


export default class CheckIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      authenticated: false,
      loading: true,
    };
  }

  componentWillMount() {
    User.isUserSignedIn({
      onSuccess: (data) => {
        if (this.ismounted) {
          this.setState({
            loading: false,
            authenticated: data.authenticated,
          });
        }
      },
      onError: (error) => {
        this.setState({
          loading: false,
          authenticated: error.authenticated,
        });
      },
    });
  }

  componentDidMount() {
    this.ismounted = true;
    FCM.requestPermissions(); // for iOS
    FCM.getFCMToken().then(() => {
      // console.log(token);
      // store fcm token in your server
    });
    this.notificationListener = FCM.on(FCMEvent.Notification, (notif) => {
      // there are two parts of notif. notif.notification contains the notification
      // payload, notif.data contains data payload
      if (notif.local_notification) {
        // this is a local notification
      }
      if (notif.opened_from_tray) {
        // app is open/resumed because user clicked banner
      }
    });
    this.refreshTokenListener = FCM.on(FCMEvent.RefreshToken, () => {
      // console.log(token);
      // fcm token may not be available on first load, catch it here
    });
    FCM.subscribeToTopic('messages');
    BackHandler.addEventListener('hardwareBackPress', RNExitApp.exitApp);
  }

  componentWillUnmount() {
    this.ismounted = false;
    this.notificationListener.remove();
    this.refreshTokenListener.remove();
    BackHandler.removeEventListener('hardwareBackPress', RNExitApp.exitApp);
  }

  render() {
    if (this.state.loading) {
      return (
        <ActivityIndicator
          animating={this.state.loading}
          style={[styles.centering, { height: 80 }]}
          size="large"
        />
      );
    }
    return (
      <Router>
        <Scene key="root">
          <Scene
            key="Home"
            component={Home}
            initial={this.state.authenticated}
            title="Home"
            hideNavBar
          />
          <Scene
            key="Login"
            component={Login}
            initial={!this.state.authenticated}
            title="Login"
            hideNavBar
          />
          <Scene key="Profile" component={Profile} title="Profile" hideNavBar />
          <Scene key="SignUp" component={SignUp} title="Sign Up" hideNavBar />
          <Scene key="Messenger" component={Messenger} hideNavBar={false} title="Messenger" />
        </Scene>
      </Router>
    );
  }
}

const styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});

AppRegistry.registerComponent('CheckIn', () => CheckIn);
