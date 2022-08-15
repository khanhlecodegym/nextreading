// Id name
var idInputEmail = 'email';
var idInputUsername = 'username';
var idInputPassword = 'password';
var idInputBookTittle = 'bookTitle';
var idValidateUsernameMin = 'validate-username-min';
var idValidateUsernameType = 'validate-username-type';
var idValidateUsernameDuplicate = 'validate-username-duplicate';
var idValidatePwdMin = 'validate-pwd-min';
var idBtnSubmit = 'btnSubmit';

// Elements
var inputEmailEl = document.getElementById(idInputEmail);
var inputUsernameEl = document.getElementById(idInputUsername);
var inputPwdEl = document.getElementById(idInputPassword);
var inputBookTitleEl = document.getElementById(idInputBookTittle);
var validateUsernameMinEl = document.getElementById(idValidateUsernameMin);
var validateUsernameTypeEl = document.getElementById(idValidateUsernameType);
var validateUsernameDuplicateEl = document.getElementById(idValidateUsernameDuplicate);
var validatePwdMinEl = document.getElementById(idValidatePwdMin);
var btnSubmit = document.getElementById(idBtnSubmit);

// Validation signup
var MIN_USERNAME_LENGTH = 6;
var validEmail = false;
var validUserNameMin = false;
var validUserNameType = false;
var validUserNameDup = false;
var validPwdMin = false;
// Validation adding book
var MIN_BOOK_TITLE_LENGTH = 2;
var validBookTitle = false;

// Helper functions
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
    timeout = null;
    if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function toggleSubmitBtnDisabled(valid) {
  if (!btnSubmit) {
    return;
  }

  btnSubmit.disabled = !valid;
  if (valid) {
    btnSubmit.classList.remove('btn-disabled');
  } else {
    btnSubmit.classList.add('btn-disabled');
  }
};

function toggleState(isValid, element) {
  if (isValid) {
    element.classList.add('text-success');
    element.classList.remove('text-error');
  } else {
    element.classList.remove('text-success');
    element.classList.add('text-error');
  }
};

function toggleInputState(isValid, element) {
  if (isValid) {
    element.classList.add('form-control-success');
    element.classList.remove('form-control-error');
  } else {
    element.classList.remove('form-control-success');
    element.classList.add('form-control-error');
  }
};

// Update state for inputs and submit btn
function validateSignUpForm() {
  inputEmailEl && inputEmailEl.value && toggleInputState(validEmail, inputEmailEl);
  inputUsernameEl && inputUsernameEl.value && toggleInputState(validUserNameMin && validUserNameType && validUserNameDup, inputUsernameEl);
  inputPwdEl && inputPwdEl.value && toggleInputState(validPwdMin, inputPwdEl);

  toggleSubmitBtnDisabled(
    validEmail && validUserNameMin && validUserNameType &&
    validUserNameDup && validPwdMin
  );
};

function validateAddingBookForm() {
  inputBookTitleEl.value && toggleInputState(validBookTitle, inputBookTitleEl);
  toggleSubmitBtnDisabled(validBookTitle);
};

function validateEmail(value) {
  var emailRegex = /\S+@\S+\.\S+/;
  var valid = emailRegex.test(value);

  return valid;
};

function validateInputMin(value, minLen, element) {
  var valid = false;

  if (value) {
    if (value.length >= minLen) {
      valid = true;
    }

    if (element) {
      toggleState(valid, element);
    }
  } else {
    if (element) {
      element.classList.remove('text-success');
      element.classList.remove('text-error');
    }
  }

  return valid;
};

function validateUsername(value, element) {
  var usernameRegex = /^[a-zA-Z0-9]+$/;
  var isValidCharacters = usernameRegex.test(value);
  var isAllLowerCase = value === value.toLowerCase();
  var valid = isValidCharacters && isAllLowerCase;

  if (valid) {
    toggleState(true, element);
  } else {
    toggleState(false, element);
  }

  return valid;
};

var checkDupUsername = debounce(function(value) {
  validUserNameDup = false;
  validateUsernameDuplicateEl.classList.add('text-light');
  validateUsernameDuplicateEl.innerHTML = 'Checking...';

  fetch(window.location.origin + '/api/check-username?query=' + value)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var duplicate = data.duplicate;
      var messageTxt = '<b>' + value + '</b> ';

      if (duplicate) {
        validUserNameDup = false;
        messageTxt += 'is not available.';
        validateUsernameDuplicateEl.classList.add('text-error');
        validateUsernameDuplicateEl.classList.remove('text-success');
      } else {
        validUserNameDup = true;
        messageTxt += 'is available.';
        validateUsernameDuplicateEl.classList.remove('text-error');
        validateUsernameDuplicateEl.classList.add('text-success');
      }

      validateUsernameDuplicateEl.classList.remove('text-light');
      validateUsernameDuplicateEl.innerHTML = messageTxt;
      validateSignUpForm();
    });
}, 300);

// Validating when input changes
if (inputEmailEl) {
  inputEmailEl.addEventListener('keyup', function(e) {
    var value = e.target.value;
    validEmail = validateEmail(value);
    validateSignUpForm();
  });
}

if (inputUsernameEl) {
  inputUsernameEl.addEventListener('keyup', function(e) {
    var value = e.target.value;
    validUserNameMin = validateInputMin(value, MIN_USERNAME_LENGTH, validateUsernameMinEl);
    validUserNameType = validateUsername(value, validateUsernameTypeEl);

    if (validUserNameMin && validUserNameType) {
      checkDupUsername(value);
    }

    validateSignUpForm();
  });
}

if (inputPwdEl) {
  inputPwdEl.addEventListener('keyup', function(e) {
    var value = e.target.value;
    validPwdMin = validateInputMin(value, MIN_USERNAME_LENGTH, validatePwdMinEl);
    validateSignUpForm();
  });
}

if (inputBookTitleEl) {
  validBookTitle = validateInputMin(inputBookTitleEl.value, MIN_BOOK_TITLE_LENGTH, null);
  validateAddingBookForm();

  inputBookTitleEl.addEventListener('keyup', function(e) {
    var value = e.target.value;
    validBookTitle = validateInputMin(value, MIN_BOOK_TITLE_LENGTH, null);
    validateAddingBookForm();
  });
}
