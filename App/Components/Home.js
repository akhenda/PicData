import React, { Component } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  Picker,
  ScrollView,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
  TouchableHighlight,
  PermissionsAndroid,
} from 'react-native';

import Geocoder from 'react-native-geocoder';
import RNExitApp from 'react-native-exit-app';
import { Actions } from 'react-native-router-flux';
import ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import FusedLocation from 'react-native-fused-location';
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';

import CheckIn from './CheckIn';
import { User, Category, Submission } from '../Models';
import Button from './Common/Button';


class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user: null,
      file: null,
      message: '',
      progress: 0,
      error: false,
      loading: true,
      location: null,
      categories: null,
      submitting: false,
      subcategories: null,
      modalVisible: false,
      geocodedLocation: null,
      selectedCategory: null,
      locationUpdates: false,
      selectedSubCategory: null,
    };
  }

  componentWillMount() {
    Category.getCategories({
      onSuccess: (data) => {
        if (this.ismounted) {
          this.setState({
            user: data.user,
            categories: data.categories,
            subcategories: data.subcategories,
            loading: false,
          });
        }
      },
      onError: (error) => {
        if (this.ismounted) this.setState({ error: true, message: error.message });
      },
    });
  }

  componentDidMount() {
    this.ismounted = true;
    LocationServicesDialogBox.checkLocationServicesIsEnabled({
      message: "<h2>Use Location?</h2>This app wants to change your device settings:<br/><br/>Use GPS, Wi-Fi, and Cell Network for location<br/><br/><a href='#'>Learn more</a>",
      ok: 'YES',
      cancel: 'NO',
      enableHighAccuracy: true, // true => GPS AND NETWORK PROVIDER, false => ONLY GPS PROVIDER
      showDialog: true, // false => Opens the Location access page directly
    })
      .then(async () => {
        // success => {alreadyEnabled: true, enabled: true, status: 'enabled'}
        const granted = await PermissionsAndroid
          .request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
            title: 'App needs to access your location',
            message: 'App needs access to your location ' +
            'so we can let our app be even more awesome.',
          });
        if (granted) {
          // Set options.
          FusedLocation.setLocationPriority(FusedLocation.Constants.HIGH_ACCURACY);
          FusedLocation.setLocationInterval(15000);
          FusedLocation.setFastestLocationInterval(10000); 
          FusedLocation.setSmallestDisplacement(1);
          
          this.getLocationOnce();
          this.subscribeToLocation();
          this.subscribeToLocationErrors();
        }
      })
      .catch(() => {
        RNExitApp.exitApp();
      });
    
    BackHandler.addEventListener('hardwareBackPress', () => {
      LocationServicesDialogBox.forceCloseDialog();
    });
  }
  
  componentWillUnmount() {
    this.ismounted = false;
    FusedLocation.off(this.subscription);
    FusedLocation.off(this.errSubscription);
    FusedLocation.stopLocationUpdates();
  }
  
  async getLocationOnce() {
    // Get location once. 
    const location = await FusedLocation.getFusedLocation(true);
    this.saveLocation(location);
  }
  
  getLocationThenStopUpdates() {
    this.getLocationOnce();
    FusedLocation.off(this.subscription);
    FusedLocation.off(this.errSubscription);
    FusedLocation.stopLocationUpdates();
    this.setState(() => ({ locationUpdates: false }));
  }
  
  subscribeToLocation() {
    // Keep getting updated location.
    FusedLocation.startLocationUpdates();
    this.setState(() => ({ locationUpdates: true }));

    // Place listeners.
    this.subscription = FusedLocation.on('fusedLocation', (location) => {
      this.saveLocation(location);
    }); 
  }
  
  subscribeToLocationErrors() {
    this.errSubscription = FusedLocation.on('fusedLocationError', (error) => {
      if (this.ismounted) {
        this.setState({ 
          error: true,
          message: error.message ? error.message : 'Unknown Error!',
        });
      }
    });
  }
  
  saveLocation(location) {
    if (this.state.locationUpdates) {
      Geocoder.geocodePosition({
        lat: location.latitude,
        lng: location.longitude,
      }).then((geocodedLocation) => {
        this.setState(() => ({ location, geocodedLocation }));
      }).catch((error) => {
        this.setState(() => ({ 
          error: true,
          message: error.message ? error.message : 'Unknown Error!',
        }));
      });
    }
  }

  logout() {
    User.logoutUser({
      onSuccess: (data) => {
        if (data.loggedOut) {
          Actions.Login();
        }
      },
      onError: (error) => {
        this.setState({ error: true, message: error.message });
      },
    });
  }

  selectImage() {
    const fileOptions = {
      title: 'Select Image',
      storageOptions: {
        skipBackup: true,
        path: 'picData/images',
      },
    };
    
    // Get new location and turn updates off
    this.getLocationThenStopUpdates();
    
    ImagePicker.launchCamera(fileOptions, (response) => {
      if (response.didCancel) {
        // Turn Location updates on again and start listening
        this.subscribeToLocation();
        this.subscribeToLocationErrors();
      } else if (response.error) {
        // Turn Location updates on again and start listening
        this.subscribeToLocation();
        this.subscribeToLocationErrors();
      } else {
        this.setState({ file: response });
      }
    });
  }

  handleSubmit() {
    const {
      user,
      location,
      geocodedLocation,
      selectedCategory,
      selectedSubCategory,
    } = this.state;
    
    this.setState({ submitting: true });
    if (selectedCategory && selectedSubCategory && location) {
      const data = {
        category_id: selectedCategory.id,
        category_name: selectedCategory.display,
        subcategory_id: selectedSubCategory.id,
        subcategory_name: selectedSubCategory.display,
        location,
        geo_location: geocodedLocation,
        sender_id: user.uid,
      };

      Submission.submitItem({
        data,
        file: this.state.file,
        onSuccess: () => {
          this.setState({
            message: '',
            file: null,
            submitting: false,
            error: false,
            selectedCategory: null,
            selectedSubCategory: null,
            modalVisible: false,
            progress: 0,
          });

          // Turn Location updates on again and start listening
          this.subscribeToLocation();
          this.subscribeToLocationErrors();
        },
        onProgress: (progress) => {
          this.setState({ progress });
        },
        onError: ({ message }) => {
          this.setState({ error: true, message });
        },
      });
    }
  }

  activityIndicator() {
    return (
      <Image
        source={require('../Resources/pattern.png')}
        style={styles.mainContainer}
      >
        <ActivityIndicator
          animating={this.state.loading}
          style={[styles.centering, { height: 80 }]}
          size="large"
        />
      </Image>
    );
  }

  errorScreen() {
    return (
      <Image
        source={require('../Resources/pattern.png')}
        style={styles.mainContainer}
      >
        <View style={styles.pageArea}>
          <Text style={styles.pageTitle}>We encountered an error!</Text>
          <View style={styles.iconContainer}>
            <Image
              style={styles.checkInIcon}
              source={require('../Resources/Icons/error210.png')}
            />
          </View>
          <Text style={styles.errorMessage}>{this.state.message}</Text>
          <Button
            onPress={() => Actions.Home()}
            loading={this.state.checkingIn}
            message="Reload"
          />
        </View>
      </Image>
    );
  }

  renderUser() {
    return <CheckIn user={this.state.user} />;
  }
  
  renderUserLocation() {
    const { location, geocodedLocation } = this.state;
    return (
      <View>
        <Text>
          You are at:
          <Text style={{ fontWeight: '700' }}>{` ${geocodedLocation ? geocodedLocation[0].formattedAddress : 'Unknown Location'} `}</Text>
          within
          <Text style={{ fontWeight: '700' }}>{` ${location ? location.latitude : '0'}, ${location ? location.longitude : '0'}`}</Text>
        </Text>
      </View>
    );
  }

  renderCategoryPicker(items, text) {
    const { categories, selectedCategory, selectedSubCategory } = this.state;

    if (items) {
      return (
        <View style={styles.picker}>
          <Text>Choose a {text}</Text>
          <Picker
            selectedValue={items === categories ? selectedCategory : selectedSubCategory}
            onValueChange={(itemValue) => {
              if (items === categories) {
                this.setState({ selectedCategory: itemValue });
              } else {
                this.setState({ selectedSubCategory: itemValue });
              }
            }}
          >
            <Picker.Item label="---" value={undefined} />
            {Object.keys(items).map((cat) => {
              return <Picker.Item key={cat} label={items[cat].display} value={items[cat]} />;
            })}
          </Picker>
        </View>
      );
    }
    return (
      <View>
        <Text>Loading Items...</Text>
      </View>
    );
  }
  
  renderCapturedImage() {
    const { file } = this.state;
    
    if (file) {
      return (
        <TouchableOpacity onPress={() => this.selectImage()}>
          <Image
            source={{ uri: file.uri }}
            style={styles.capturedImage}
          />
        </TouchableOpacity>
      );
    }
  }

  renderUploadBtn() {
    const { file } = this.state;
    return (
      <TouchableHighlight
        underlayColor="#DCDCDC"
        style={styles.uploadBtnContainer}
        onPress={() => this.selectImage()}
      >
        <View
          style={[styles.uploadBtn, file ? { backgroundColor: '#B2B3B4' } : null]}
        >
          {!file ? (
            <View style={styles.uploadBtnNoImage}>
              <Icon
                size={30}
                color="#787878"
                style={styles.uploadIcon}
                name="ios-cloud-upload-outline"
              />
              <Text style={styles.uploadText}>Take Picture</Text>
            </View>
          ) : (
            <Text style={styles.uploadedText}>{file.fileName.toUpperCase()}</Text>
          )}
        </View>
      </TouchableHighlight>
    );
  }

  renderLogoutModal() {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={this.state.modalVisible}
        onRequestClose={() => null}
      >
       <View style={{ marginTop: 22 }}>
        <View>
          <Text>Hello World!</Text>

          <TouchableHighlight
            onPress={() => {
              this.setModalVisible(!this.state.modalVisible);
            }}
          >
            <Text>Hide Modal</Text>
          </TouchableHighlight>
        </View>
       </View>
      </Modal>
    );
  }
  
  renderSubmitProgress() {
    const { progress } = this.state;
    
    if (progress > 0) {
      return (
        <View style={styles.progress}>
          <Text style={styles.progressText}>Uploading... {progress.toFixed(1)}%</Text>
        </View>
      );
    }
  }

  render() {
    const {
      categories, subcategories, loading, error, submitting,
    } = this.state;
    if (loading) {
      return this.activityIndicator();
    } else if (error) {
      return this.errorScreen();
    }
    return (
      <Image
        source={require('../Resources/pattern.png')}
        style={styles.mainContainer}
      >
        {/* this.renderLogoutModal() */}
        <ScrollView style={styles.pageArea}>
          <Text style={styles.pageTitle}>{'PicData'.toUpperCase()}</Text>
          {this.renderUser()}
          {this.renderUserLocation()}
          {this.renderCategoryPicker(categories, 'Category')}
          {this.renderCategoryPicker(subcategories, 'Sub Category')}
          {this.renderCapturedImage()}
          {this.renderUploadBtn()}
          {this.renderSubmitProgress()}
          <Button
            onPress={() => this.handleSubmit()}
            loading={submitting}
            message="Submit Item"
          />
          <Button
            onPress={() => this.logout()}
            loading={false}
            message="Logout"
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Image>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    height: null,
    width: null,
  },
  pageArea: {
    flex: 1,
    padding: 35,
    backgroundColor: '#fff',
  },
  pageTitle: {
    alignSelf: 'center',
    fontSize: 32,
    fontWeight: '700',
    paddingBottom: 0,
    textAlign: 'center',
  },
  centering: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInIcon: {
    alignSelf: 'center',
    height: 150,
    width: 150,
    // borderRadius: 75,
  },
  errorMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 20,
  },
  picker: {
    marginTop: 15,
    marginBottom: 15,
  },
  uploadBtnContainer: {
    marginTop: 20,
    marginBottom: 50,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C5C5C6',
    backgroundColor: '#F3F3F3',
  },
  uploadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  uploadBtnNoImage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    marginRight: 6,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  uploadedText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progress: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressText: {
    color: '#998800',
    fontSize: 17,
  },
  bottomSpacer: {
    height: 20,
    marginBottom: 100,
  },
  capturedImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 5,
    borderColor: 'rgb(145,70,167)',
  },
});


export default Home;
