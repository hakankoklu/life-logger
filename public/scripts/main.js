/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';


// Signs-in.
function signIn() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithRedirect(provider);
}

// Signs-out.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!

    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');

    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');

    // Hide sign-out button.
    signOutButtonElement.setAttribute('hidden', 'true');
  }
}

// Shortcuts to DOM Elements.
var oneLogButton = document.getElementById('one-log-button');
var newLogField = document.getElementById('one-log-field');
var allLogsSection = document.getElementById('all-logs');
var allLogsContent = allLogsSection.getElementsByClassName('page-content')[0]
var allLogsTab = document.getElementById('all-logs-tab');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
// random Firebase location
var firestore = firebase.firestore();

function saveLog(position) {
    var newLog = newLogField.value;
    var user = firebase.auth().currentUser;
    var timestamp = new Date();
    var logData = {
        logText: newLog,
        logged_at: timestamp,
        location: new firebase.firestore.GeoPoint(position.coords.latitude, position.coords.longitude)
    };
    console.log("Data to log...")
    console.log(logData)
    var userRef = firestore.collection("users").doc(user.uid);
    userRef.collection("logs").add(logData)
    .then(function() {
    console.log("Data is logged.");
    newLogField.value = "";
    });
}

function addLog() {
    console.log("Trying to add log...")
    navigator.geolocation.getCurrentPosition(saveLog)
}

function formatLogTime(utcsecs) {
    utcsecs = utcsecs["seconds"]
    var d = new Date(0);
    d.setUTCSeconds(utcsecs);
    return d.toLocaleString();
}

function formatLocation(loc) {
    var lat = loc['latitude'];
    var long = loc['longitude'];
    return Number.parseFloat(lat).toFixed(3) + ', ' + Number.parseFloat(long).toFixed(3);
}

function getAllLogs() {
    var user = firebase.auth().currentUser;
    if (user) {
        var allLogs = firestore.collection("users").doc(user.uid).collection("logs").orderBy("logged_at", "desc");
        while (allLogsContent.firstChild) {
            allLogsContent.removeChild(allLogsContent.firstChild);
        }
        allLogs.get().then(function(querySnapshot) {
            allLogsContent.innerHtml = "";
            var table = document.createElement('table');
            table.setAttribute('class', 'mdl-data-table mdl-js-data-table');
            var tableBody = document.createElement('tbody');

            var row = document.createElement('tr');
            var timeHead = document.createElement('th');
            timeHead.appendChild(document.createTextNode('Logged at'));

            var locHead = document.createElement('th');
            locHead.appendChild(document.createTextNode('Coordinates'));

            var logHead = document.createElement('th');
            logHead.appendChild(document.createTextNode('Log'));

            row.appendChild(logHead);
            row.appendChild(timeHead);
            row.appendChild(locHead);

            tableBody.appendChild(row);
            
            querySnapshot.forEach(function(doc) {
                var row = document.createElement('tr');

                var logTime = formatLogTime(doc.data().logged_at);
                var logTimeText = document.createTextNode(logTime);
                
                var loc = formatLocation(doc.data().location)
                var locText = document.createTextNode(loc);
                
                var logTextText = document.createTextNode(doc.data().logText);
                
                var logTimeCell = document.createElement('td');
                logTimeCell.appendChild(logTimeText);
                var locCell = document.createElement('td');
                locCell.appendChild(locText);
                var logTextCell = document.createElement('td');
                logTextCell.appendChild(logTextText);
                
                row.appendChild(logTextCell);
                row.appendChild(logTimeCell);
                row.appendChild(locCell);
            
            tableBody.appendChild(row);
            // console.log(doc.id, " => ", doc.data());
            });
            table.appendChild(tableBody);
            allLogsContent.appendChild(table);
    });
    }
}


// Bindings on load.
window.addEventListener('load', function() {
    oneLogButton.addEventListener('click', addLog);
    signOutButtonElement.addEventListener('click', signOut);
    signInButtonElement.addEventListener('click', signIn);
    allLogsTab.addEventListener('click', getAllLogs);
}, false);

initFirebaseAuth();