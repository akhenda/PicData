'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
} from 'react-native';

import gravatar from 'gravatar';

class CheckIn extends Component {
  render() {
    return (
      <View style={styles.checkInBlock}>
        <Image
          style={styles.avatar}
          source={{uri: "https:" + gravatar.url(this.props.user.email)}} />
      <Text style={styles.name}>{this.props.user.name}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  checkInBlock: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 30,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  name: {
    paddingLeft: 10,
    fontSize: 15,
    fontWeight: '300',
  }
});


export default CheckIn;
