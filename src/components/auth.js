import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const config = {
  apiKey: "AIzaSyDm7zrnUA3hk0kPzFhTXaVN5xGuB-3fbJs",
  authDomain: "stocks-af048.firebaseapp.com",
  databaseURL: "https://stocks-af048.firebaseio.com",
  projectId: "stocks-af048",
  storageBucket: "stocks-af048.appspot.com",
  messagingSenderId: "120406405318"
};

firebase.initializeApp(config)

export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const firebaseAuth = firebase.auth
export const db = firebase.firestore();

export function loginWithGoogle() {
  return firebaseAuth().signInWithRedirect(googleProvider);
}

export function auth(email, pw) {
  let username = localStorage.getItem('user')
  return firebaseAuth().createUserWithEmailAndPassword(email, pw)
    .then(function (newUser) {
      db.collection("users").doc(newUser.user.uid).set({
        email: email,
        username: username,
        funds: "100000",
        currentfunds: "100000",
        accountValue: "100000"
      })
        .catch(function (error) {
          console.error("Error writing document: ", error);
        });
      return firebase.auth().currentUser.updateProfile({
        displayName: username
      });
    })

}

export function logout() {
  return firebaseAuth().signOut()
}

export function login(email, pw) {
  return firebaseAuth().signInWithEmailAndPassword(email, pw)
}

export function resetPassword(email) {
  return firebaseAuth().sendPasswordResetEmail(email)
}

