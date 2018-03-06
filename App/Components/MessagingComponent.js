import React, { Component } from 'react'
import { NavigationActions } from "react-navigation";
import {StyleSheet, ScrollView, View, Text, TextInput, Keyboard, TouchableWithoutFeedback} from "react-native";
import MessageComponent from "./MessageComponent";
import Ionicons from 'react-native-vector-icons/Feather';
import firebase from 'react-native-firebase';
import User from './User';
import _ from 'lodash';

export default class MessagingComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      messageObject : null,
      user          : null,
      type          : null
    };

    this.fetchMessagesObject = this.fetchMessagesObject.bind(this);
  }

  componentDidMount() {
    this.fetchMessagesObject();
  };

  navigateToScreen = (route) => () => {
    const navigateAction = NavigationActions.navigate({
      routeName: route
    });
    this.props.navigation.dispatch(navigateAction);
  };

  fetchMessagesObject = () => {
    User().then(user => {
      firebase.app().database().ref(`/Users/${user.uid}`).on('value', (snap) => {
        if (snap.val()) this.setState({ type: snap.val().type, user: snap.val() }, () => {
          this.messages = snap.val().type === "Doctor" ? (
            firebase.app().database().ref('/PatientsCommentsToDoctors')
          ) : (
            firebase.app().database().ref('/DoctorsCommentsToPatients')
          );

          this.initMessages  = this.initMessages.bind(this);
          this.initMessages(this.messages, user, snap.val().type);
        });
      });
    });
  };

  initMessages = (messages, user, type) => {
    messages.on('value', snap => {
      if (snap.val() && this.state.user) {
        const Users = (type === "Patient") ? (this.state.user.Doctors || null) : (this.state.user.Patients || null);
        const message = snap.val();

        if (Users) this.setState({
          messageObject: Object.keys(Users).map(($uid,i) => {
            const _uid = `${$uid}<=>${user.uid}`;

            if (message[_uid]) {
              const { healthAlert, messages, name, uid } = message[_uid];
              const latest = messages ? Object.values(messages)[Object.keys(messages).length - 1] : null;
              if (latest) {
                return (
                  <MessageComponent
                    name={name}
                    uid={uid}
                    healthAlert={healthAlert}
                    comment={latest ? latest.msgText : ""}
                    timeStamp={latest ? latest.timeStamp : ""}
                    type={this.state.type}
                    key={i}
                  />
                );
              }
            }
          })
        });
      }
    });
  };


  patientContext = (messageData, user) => {
    const { Doctors } = this.state.user;
    this.setState({
      messageObject: Doctors ? Object.keys(Doctors).map(($uid,i) => {
        const doctorFirebaseUID = `${$uid}<=>${user.uid}`;

        if (messageData[doctorFirebaseUID]) {
          const { healthAlert, messages, name, uid } = messageData[doctorFirebaseUID];
          const latest = messages ? Object.values(messages)[Object.keys(messages).length - 1] : null;
          if (latest) {
            return (
              <MessageComponent
                name={name}
                uid={uid}
                healthAlert={healthAlert}
                comment={latest ? latest.msgText : ""}
                timeStamp={latest ? latest.timeStamp : ""}
                type={this.state.type}
                key={i}
              />
            );
          }
        }
      }): null
    });
  };

  doctorContext = (messageData, user) => {
    const { Patients } = this.state.user;
    this.setState({
      messageObject: Patients ? Object.keys(Patients).map(($uid,i) => {
        const patientFirebaseUID = `${$uid}<=>${user.uid}`;
        const { healthAlert = "Stable", messages, name, uid } = messageData[patientFirebaseUID] || {};
        if (healthAlert && messages && name && uid) {
          const latest = Object.values(messages)[Object.keys(messages).length - 1];
          return (
            <MessageComponent
              name={name}
              uid={uid}
              healthAlert={healthAlert}
              comment={latest ? latest.msgText : ""}
              timeStamp={latest ? latest.timeStamp : ""}
              type={this.state.type}
              key={i}
            />
          );
        }
      }): null
    });
  };



  render () {
    return (
      <View style={styles.sideMenuContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{position: 'relative', marginBottom: 20}}>
            <Ionicons name="search" size={18} color="rgba(188,202,208, 0.5)" style={{position: 'absolute', left: 15, top: 16}} />
            <TextInput style={styles.searchInput} placeholder="Search..." underlineColorAndroid="transparent" placeholderTextColor={"#bccad0"}/>
          </View>
        </TouchableWithoutFeedback>
        <ScrollView showsVerticalScrollIndicator={false}>{this.state.messageObject}</ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sideMenuContainer: {
    flex: 1,
    //paddingTop: 40,
    padding: 20
  },
  searchInput: {
    fontSize: 13,
    color: "#aab8be",
    height: 30,
    paddingTop:0,
    paddingBottom: 0,
    paddingLeft: 40,
    backgroundColor: 'rgba(188,202,208, 0.1)',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5
  },
});
