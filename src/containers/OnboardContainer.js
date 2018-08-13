import { Container } from 'unstated';
import SetCookie from '../cookies/SetCookie';
import GetCookie from '../cookies/GetCookie';
import DeleteCookie from '../cookies/DeleteCookie';

class OnboardContainer extends Container {
  constructor () {
    super();

    var isTokenPresent = GetCookie("joyread") ? true : false;
    
    this.state = {
      isSignedUp: false, // pull info from backend if admin had already signed up
      isSignedIn: isTokenPresent,
      isSignUpFilled: false // bool true if signup field values are entered and ready to move to next step
    };
  }

  removeOnboardErrors() {
    var onboardErrors = document.getElementsByClassName('onboard__error');
    for (var i = 0; i < onboardErrors.length; i++) {
      onboardErrors[i].classList.remove('onboard__error--active');
    }
  }

  // Check if required field value is valid
  isFieldValid(pattern, fieldValue, errorField, errorText) {
    if (!pattern.test(fieldValue)) {
      document.getElementById(errorField).innerText = errorText;
      document.getElementById(errorField).classList.add('onboard__error--active');
      return true;
    }

    return false;
  }

  // Check if required field value is valid according to the regexp pattern given
  isFieldNone(fieldValue, errorField, errorText) {
    if (fieldValue === '') {
      document.getElementById(errorField).innerText = errorText;
      document.getElementById(errorField).classList.add('onboard__error--active');
      return true;
    }

    return false;
  }

  signUp(event, url) {
    event.preventDefault();

    var username = document.getElementById('signUpUsername').value;
    var email = document.getElementById('signUpEmail').value;
    var password = document.getElementById('signUpPassword').value;

    var isError = false;
    this.removeOnboardErrors();

    // Check for valid username
    isError = this.isFieldValid(/^[\w&.-]+$/, username, 'signUpUsernameError', 'Invalid username - Special characters allowed are & . -');

    // Check if username value is none
    isError = this.isFieldNone(username, 'signUpUsernameError', 'This field is required');

    // Check for valid email
    isError = this.isFieldValid(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, email, 'signUpEmailError', 'Invalid email address');

    // Check if email value is none
    isError = this.isFieldNone(email, 'signUpEmailError', 'This field is required');

    // Check if password value is none
    isError = this.isFieldNone(password, 'signUpPasswordError', 'This field is required');

    // Return false if any of the above errors exists
    if (isError) return false;
    

    var data = {
      username: username,
      email: email,
      password: password
    }

    fetch(url, {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.status === 'registered') {
        DeleteCookie('joyread');
        SetCookie('joyread', data.token, 30);
        
        this.setState({ isSignUpFilled: true });
        document.getElementById('alert').innerHTML = '<i></i><p>Your signup form is successfully registered</p>';
        document.getElementById('alert').classList.add('alert--success');
      } else {
        document.getElementById('alert').innerHTML = '<i></i><p>Not registered</p>';
        document.getElementById('alert').classList.add('alert--error');
      }
    });
  }

  smtp(event, url) {
    event.preventDefault();

    var smtpHostname = document.getElementById('smtpHost').value;
    var smtpPort = document.getElementById('smtpPort').value;
    var smtpUsername = document.getElementById('smtpUsername').value;
    var smtpPassword = document.getElementById('smtpPassword').value;

    var isError = false;
    this.removeOnboardErrors();

    // Check if smtp hostname is none
    isError = this.isFieldNone(smtpHostname, 'smtpHostError', 'This field is required');

    // Check if smtp port is none
    isError = this.isFieldNone(smtpPort, 'smtpPortError', 'This field is rquired');

    // Check if smtp username is none
    isError = this.isFieldNone(smtpUsername, 'smtpUsernameError', 'This field is rquired');

    // Check if smtp password is none
    isError = this.isFieldNone(smtpPassword, 'smtpPasswordError', 'This field is rquired');

    // Return false if any of the above errors exists
    if (isError) return false;
  }
  
  signIn(event, url) {
    event.preventDefault();
    
    var usernameoremail = document.getElementById('signInUsernameOrEmail').value;
    var password = document.getElementById('signInPassword').value;

    var data = {
      usernameoremail: usernameoremail,
      password: password
    }

    fetch(url, {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.status === 'authorized') {
        DeleteCookie('joyread');
        SetCookie('joyread', data.token, 30);

        this.setState({ isSignedIn: true });
      } else {
        document.getElementById('alert').innerHTML = '<i></i><p>Your login credentials are incorrect</p>';
        document.getElementById('alert').classList.add('alert--error');
      }
    });
  }

  signOut() {
    DeleteCookie('joyread')
    this.setState({ isSignedIn: false });
  }
}

export default OnboardContainer;