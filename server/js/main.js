// Id name
var idInputSearch = 'input-search';
var idSearchResults = 'search-results';
var idMenuNavigation = 'menu';
var idSnackbar = 'snackbar';
var classBtnAction = 'btn-action';
var classBtnShowMore = 'btn-show-more';
var classBtnDisplay = 'btn-display';
var classBtnCopy = 'btn-copy';
var classContentHidden = 'content-hidden';
var classModal = 'modal';

// Element selector
var btnAction = document.getElementsByClassName(classBtnAction);
var btnShowMore = document.getElementsByClassName(classBtnShowMore);
var btnDisplay = document.getElementsByClassName(classBtnDisplay);
var btnCopy = document.getElementsByClassName(classBtnCopy);
var modalElement = document.getElementsByClassName(classModal);
var inputSearch = document.getElementById(idInputSearch);
var menuElement = document.getElementById(idMenuNavigation);

function initGtag() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-DZSXTD2SGT');
};

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

function displaySnackbar(success, message) {
  var snackbarEl = document.getElementById(idSnackbar);
  var className = 'show ';
  className += success ? 'success' : 'error';

  snackbarEl.className = className;
  snackbarEl.innerText = message;

  setTimeout(function() {
    snackbarEl.className = '';
  }, 2900);
};

function postRequest(endpoint, payload, callback) {
  var XHR = new XMLHttpRequest();
  XHR.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      return callback(JSON.parse(this.responseText));
    }
  };

  XHR.open('POST', window.location.origin + endpoint);
  XHR.setRequestHeader('Content-Type', 'application/json');
  XHR.send(JSON.stringify(payload));
};

function voteBookReview(id, element) {
  var endpoint = '/api/vote-review';
  var data = { id: id };

  postRequest(endpoint, data, function(res) {
    if (res.success) {
      var score = res.score;
      element.classList.toggle('icon-vote-active');

      if (!isNaN(score)) {
        element.nextSibling.innerHTML = score;
      }

      displaySnackbar(true, 'Successfully vote review.');
    } else {
      displaySnackbar(false, res.message);
    }
  })
};

function renderSearchResult(books) {
  var content = '';

  books.forEach(function(it) {
    content += '<a class="search-item" href="/book/' + it.slug + '" title="' + it.title + '">';
    content += '<img class="img-table search-item-img" src="' + (it.img || '/img/placeholder-book.svg') + '" />';
    content += '<div class="search-item-content">'
    content += '<p class="search-item-title text-ellipsis">' + it.title + '</p>';
    content += '<p class="search-item-title text-small">' + it.author + '</p>';
    content += '</div></a>';
  })

  return content;
};

function toggleModal(modalId) {
  document.body.classList.toggle('modal-open');
  document.getElementById(modalId).classList.toggle('hidden');
};

var searchBook = debounce(function(value) {
  var searchResultsElement = document.getElementById(idSearchResults);

  if (!value || value.length < 3) {
    return searchResultsElement.classList.add('hidden');
  }

  // Display search results box
  searchResultsElement.classList.remove('hidden');
  searchResultsElement.innerHTML = '<p class="search-item">Searching...</p>';

  fetch(window.location.origin + '/api/search-book?query=' + value)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var books = data.books;
      var exactMatch = data.exactMatch;
      var renderText = '';

      if (books.length) {
        renderText = renderSearchResult(books);
      } else {
        renderText += '<p class="search-item">No results found!!!</p>';
      }

      if  (!exactMatch) {
        renderText += '<a href="/adding-book?title=';
        renderText += encodeURIComponent(value);
        renderText += '" class="search-item search-item-option text-small">';
        renderText += '<span class="text-light">Doesn&apos;t match your Book title? Help us adding new book called:</span>&nbsp;"' + value + '"</a>';
      }

      return searchResultsElement.innerHTML = renderText;
    });
}, 300);

// Btn Action
Array.from(btnAction).forEach(function(element) {
  element.addEventListener('click', function() {
    var name = this.getAttribute('data-name');
    var value = this.getAttribute('data-value');
    var id = this.getAttribute('data-id');

    // Toggle side bar
    if (name === 'menu') {
      menuElement.classList.toggle('hidden-mobile');
    }

    // Open modal
    if (name === 'modal') {
      toggleModal(id);

      if (id === 'modalReview') {
        var inputReviewId = document.getElementById('inputReviewId');

        if (inputReviewId) {
          inputReviewId.value = '';
        }
      }
    }

    // Voting up Review Detail
    if (name === 'vote') {
      voteBookReview(value, element);
    }
  });
});

Array.from(btnShowMore).forEach(function(element) {
  element.addEventListener('click', function() {
    var contentEl = this.previousSibling;

    if (contentEl) {
      contentEl.classList.toggle(classContentHidden);

      if (contentEl.classList.contains(classContentHidden)) {
        this.innerHTML = 'More...';
      } else {
        this.innerHTML = 'Less';
      }
    }
  });
});

// Btn toggle hidden class to show or hide
Array.from(btnDisplay).forEach(function(element) {
  element.addEventListener('click', function() {
    var classHidden = 'hidden';
    var toggleElId = this.getAttribute('data-id');
    var toggleElClass = this.getAttribute('data-class');
    var selectElId = this.getAttribute('data-select');

    var anotherEl = document.getElementsByClassName(toggleElClass);
    var toggleEl = document.getElementById(toggleElId);

    // Hidden all other elements
    Array.from(anotherEl).forEach(function(otherEl) {
      otherEl.classList.add(classHidden);
    });

    // Remove hidden class on current element
    toggleEl.classList.toggle(classHidden);

    if (selectElId) {
      var selectEl = document.getElementById(selectElId);
      selectEl.select();
    }
  });
});

// Btn Copy
Array.from(btnCopy).forEach(function(element) {
  element.addEventListener('click', function() {
    var inputId = this.getAttribute('data-id');
    var inputEl = document.getElementById(inputId);

    inputEl.focus();
    inputEl.select();

    document.execCommand("copy");
    displaySnackbar(true, 'Link copied to clipboard.');
  });
});

// ClickAway on page
Array.from(modalElement).forEach(function(element) {
  element.addEventListener('click', function(event) {
    if (event.target.classList.contains(classModal)) {
      toggleModal(this.getAttribute('id'));
    }
  });
});

if (inputSearch) {
  inputSearch.addEventListener('keyup', function(e) {
    searchBook(e.target.value);
  });
}

initGtag();
(adsbygoogle = window.adsbygoogle || []).push({}); // Google Adsense
