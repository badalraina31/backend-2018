import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { User } from '../util/user';

@Injectable()
export class AuthService {

  user: Observable<User>;

  constructor(private router : Router, private afAuth : AngularFireAuth, private afs : AngularFirestore) {
    this.user = this.afAuth.authState
      .switchMap(user => {
        if (user) {
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges()
        } else {
          return Observable.of(null)
        }
      });
  }

  signUp(email: string, password: string){
    this.afAuth.auth.createUserWithEmailAndPassword(email, password)
        .then((response) => {
              console.log("Successful Sign up");
              console.log(response);
            },
            (error) => console.log(error))
  }

  signIn(email: string, password: string){
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
        .then(
            (response) => {
              console.log(response);
              this.router.navigate(['home']);
              this.getCurrentUserToken();
              this.updateUserLoginData(response.uid, response.email).then(
                (resp) => console.log(resp),
                (err) => console.log(err)
              );
            },
            (error) => console.log(error)
        );
  }

  forgotPassword(email: string){
    this.afAuth.auth.sendPasswordResetEmail(email)
      .then(
        (response) => {
          if (this.isAuthenticated()) {
            this.logout();
          }
          console.log("Successfully reset password");
        },
        (error) => console.log(error)
      );
  }

  private oAuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        this.updateUserOAuthData(credential.user)
      })
  }

  private updateUserLoginData(uid, email) {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${uid}`);
    const data: User = {
      uid: uid,
      email: email
    };
    return userRef.set(data)
  }

  private updateUserOAuthData(user) {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const data: User = {
      uid: user.uid,
      email: user.email,
      //displayName: user.displayName,
      photoURL: user.photoURL
    };
    return userRef.set(data)
  }

  logout() {
    this.afAuth.auth.signOut();
    localStorage.removeItem('isLoggedIn');
  }

  getCurrentUserToken() {
    this.afAuth.auth.currentUser.getIdToken()
        .then(
            (token: string) => {
              localStorage.setItem('isLoggedIn', token);
            }
        );
    localStorage.getItem('isLoggedIn');
  }

  isAuthenticated() {
    return !!localStorage.getItem('isLoggedIn');
  }

}
