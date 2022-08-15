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

// Id name
var idInputBookSlug = 'bookSlug';
var inputBookSlug = document.getElementById(idInputBookSlug);
var btnSubmitReviewId = '#btnSubmitReview';
var disabledClassName = 'btn-disabled';
var classBtnAction = 'btn-action';
var classInputAction = 'input-action';
var idModalActivity = '#modalActivity';
var idBtnSubmitActivity = '#btnSubmitActivity';

// Constants
var STORAGE_KEY = {
  REVIEW: 'review',
};

function getLocalStorageData(key) {
  return JSON.parse(localStorage.getItem(key));
};

function initLocalStorage() {
  var reviews = getLocalStorageData(STORAGE_KEY.REVIEW) || {};
  localStorage.setItem(STORAGE_KEY.REVIEW, JSON.stringify(reviews));
};

function getReviewContentBySlug(slug) {
  var reviews = getLocalStorageData(STORAGE_KEY.REVIEW) || {};
  return reviews[slug] || '';
};

function enableContentSaveBtn(content) {
  if(content.length >= 500) {
    $(btnSubmitReviewId).attr('disabled', false);
    $(btnSubmitReviewId).removeClass(disabledClassName);
  } else {
    $(btnSubmitReviewId).attr('disabled', true);
    $(btnSubmitReviewId).addClass(disabledClassName);
  }
};

/**
 * Update rating score when user select on item
 */
function updateRatingScore(score, wrapperElmId) {
  document.querySelectorAll(wrapperElmId + ' .icon-rating').forEach(function(element) {
    if (element.getAttribute('data-value') <= score) {
      element.classList.add('icon-rated');
    } else {
      element.classList.remove('icon-rated');
    }
  });
};

function ratingBook(data) {
  var endpoint = '/api/rating-book';

  postRequest(endpoint, data, function(res) {
    if (res.success) {
      var value = res.value;
      var startDate = res.startDate;
      var finishDate = res.finishDate;

      if (value) {
        // List all star icons
        document.querySelectorAll('.book-action-rating .icon').forEach(function(element) {
          if (element.getAttribute('data-value') <= value) {
            element.classList.add('icon-rated');
          } else {
            element.classList.remove('icon-rated');
          }
        });
      }

      if (startDate) {
        var startDateInput = document.getElementById('startDate');
        startDateInput.classList.add('text-primary');
        startDateInput.classList.remove('text-light');
      }
      if (finishDate) {
        var finishDateInput = document.getElementById('finishDate');
        finishDateInput.classList.add('text-primary');
        finishDateInput.classList.remove('text-light');
      }

      displaySnackbar(true, 'Successfully updating book activity, thank you!');
    } else {
      displaySnackbar(false, 'Updating book activity error, please refresh and try again!');
    }
  });
};

// Toggle User Book listing
function toggleUserBookListing(id, isAdding, element, isWantToRead) {
  var endpoint = isWantToRead ? '/api/book-want-to-read' : '/api/book-current-reading';
  var data = { bookId: id, isAdding: isAdding };
  var listingName = isWantToRead ? 'want to read' : 'current reading';

  postRequest(endpoint, data, function(res) {
    if (res.success) {
      var isAdding = res.isAdding;
      var newText = isAdding ? 'Remove from' : 'Add to';
      newText+= ' ' + listingName;

      var message = 'Successfully updating list!';

      element.attr('data-adding', isAdding ? 0 : 1);
      element.html('<p>' + newText + '</p>');
      displaySnackbar(true, message);
    } else {
      displaySnackbar(false, 'Updating ' + listingName + ' listing error, please refresh and try again!');
    }
  });
};

function initDatePicker(inputId) {
  var selectDate = $(inputId).val() || new Date().toJSON().slice(0,10);
  $(inputId).datepicker();
  $(inputId).datepicker('option', 'dateFormat', 'yy-mm-dd');
  $(inputId).datepicker('setDate', selectDate);
};

$(document).ready(function() {
  initLocalStorage();
  var bookSlug = inputBookSlug ? inputBookSlug.value : undefined;

  // Auto saving review content after 3s changes
  var autoSaving = debounce(function(slug, content) {
    var reviews = getLocalStorageData(STORAGE_KEY.REVIEW) || {};
    reviews[slug] = content;
    localStorage.setItem(STORAGE_KEY.REVIEW, JSON.stringify(reviews));
  }, 3000);

  // Rich text Editor
  var btnEditReviewId = '#btnEditReview';
  var modalReviewId = 'modalReview';
  var richTextEditorId = '#editor-container';
  var inputReviewId = '#inputReviewId';

  if ($(richTextEditorId).length) {
    var currentContent = getReviewContentBySlug(bookSlug);

    tinymce.init({
      selector: richTextEditorId,
      menubar: false,
      statusbar: false,
      plugins: 'fullscreen paste',
      toolbar: 'fullscreen | formatselect bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | blockquote | removeformat',
      block_formats: 'Heading=h3; Paragraph=p;',
      paste_as_text: true,
      content_css: '/editor.css',
      setup: function(editor) {
        editor.on('change', function(e) {
          enableContentSaveBtn(editor.getContent());

          if (bookSlug) {
            autoSaving(bookSlug, editor.getContent());
          }
        });
      }
    });

    if (!!currentContent) {
      // Init content from localStorage
      enableContentSaveBtn(currentContent);
      tinymce.activeEditor.setContent(currentContent);
    }
  }

  $('body').on('click', btnEditReviewId, function() {
    // Open review modal
    document.body.classList.toggle('modal-open');
    document.getElementById('modalReview').classList.toggle('hidden');

    $(inputReviewId).val($(this).data('id'));

    // Init content
    if ($(richTextEditorId).length) {
      var editContent = $('#' + $(this).data('id')).html();
      enableContentSaveBtn(editContent);
      tinymce.activeEditor.setContent(editContent);
    }
  });

  // Submit review action
  $('body').on('click', btnSubmitReviewId, function() {
    var bookId = $(this).data('id');
    var reviewId = $(inputReviewId).val();

    // Prepare data
    var data = {
      content: tinymce.activeEditor.getContent(),
      bookId: bookId,
      reviewId: reviewId,
    }

    $.ajax({
      url: '/api/add-review',
      type: 'post',
      data: data,
      success: function(res) {
        // Clear review content
        autoSaving(bookSlug, '');
        var message = 'Successfully added new Review, thank you!';

        $('#' + modalReviewId + ' .editor-wrapper').addClass('text-center text-success');
        $('#' + modalReviewId + ' .editor-wrapper').html(message);
        $(btnSubmitReviewId).attr('disabled', true);
        $(btnSubmitReviewId).addClass(disabledClassName);
        setTimeout(function() {
          // Function from main.js
          toggleModal(modalReviewId);
        }, 1000);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var message =  'Adding new Review error, please refresh page and try again!';

        $('#' + modalReviewId + ' .editor-wrapper').addClass('text-center text-error');
        $('#' + modalReviewId + ' .editor-wrapper').html(message);
        $(btnSubmitReviewId).attr('disabled', true);
        $(btnSubmitReviewId).addClass(disabledClassName);
        setTimeout(function() {
          // Function from main.js
          toggleModal(modalReviewId);
        }, 1000);
      }
    });
  });

  // User profile: User upload avatar
  function readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function(e) {
        $('#previewAvatar').attr('src', e.target.result);
        $('#uploadAvatarBtn').attr('disabled', false);
        $('#uploadAvatarBtn').toggleClass('btn-primary');
      }
      reader.readAsDataURL(input.files[0]);
    }
  };

  // Preview image first
  $('#userAvatarInput').change(function() {
    readURL(this);
  });

  $('#uploadAvatarBtn').click(function() {
    var id = $(this).data('id');
    var entity = $(this).data('entity');
    var inputFileId = $(this).data('fileid');
    var btnElement = $(this);

    // Update indicator
    btnElement.html('Uploading...');
    btnElement.attr('disabled', true);
    btnElement.toggleClass('btn-disabled');

    var API_ENDPOINT = '/api/upload-image';
    var formData = new FormData();
    var file = $('#' + inputFileId)[0].files[0];

    formData.append('file', file);
    formData.append('id', id);
    formData.append('entity', entity);

    $.ajax({
      url: API_ENDPOINT,
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false
    }).done(function(data) {
      btnElement.html('Save');
      btnElement.attr('disabled', false);
      btnElement.toggleClass('btn-primary');
      btnElement.toggleClass('btn-disabled');
      btnElement.parent().append('<p class="text-success">Succeed.</p>');
    }).fail(function(err){
      var error = JSON.parse(err.responseText);
      btnElement.html('Error');
      btnElement.attr('disabled', false);
      btnElement.toggleClass('btn-disabled');
      btnElement.parent().append('<p class="text-error">Error!!! Please try again.</p>');
      btnElement.parent().append('<p class="text-error">' + error.message + '</p>');
    });
  });

  initDatePicker('#startDate');
  initDatePicker('#finishDate');

  // Listen input action change
  $('body').on('change', '.' + classInputAction, function() {
    var id = $(this).data('id');
    var name = $(this).data('name');
    var value = $(this).val();

    if (name === 'rating-start') {
      var data = {
        bookId: id,
        startDate: value || new Date().toJSON().slice(0,10),
      }
      ratingBook(data);
    }
    if (name === 'rating-finish') {
      var data = {
        bookId: id,
        finishDate: value || new Date().toJSON().slice(0,10),
      }
      ratingBook(data);
    }
  });

  $('body').on('click', '.' + classBtnAction, function() {
    var element = $(this);
    var id = $(this).data('id');
    var name = $(this).data('name');
    var value = $(this).data('value');

    // Rating book value
    if (name === 'rating-value') {
      var data = {
        bookId: id,
        value: value
      }
      ratingBook(data);
    }

    // Toggle current-reading / want-to-read
    if (name === 'toggle') {
      var isAdding = !!Number(this.getAttribute('data-adding'));
      var isWantToReadList = false; // value = 'reading'

      if (value === 'want-to-read') {
        isWantToReadList = true;
      }

      toggleUserBookListing(id, isAdding, element, isWantToReadList);
    }

    if (name === 'modal') {
      // Update Book activity entry from User diary
      if (id === 'modalActivity') {
        var bookId = $(this).data('book-id');
        var bookName = $(this).data('book-name');
        var startDate = $(this).data('book-start-date');
        var finishDate = $(this).data('book-finish-date');
        var ratingScore = $(this).data('book-score');

        // Prepare data to submit
        $(idModalActivity + ' ' + idBtnSubmitActivity).data('book-id', bookId);
        $(idModalActivity + ' ' + idBtnSubmitActivity).data('score', ratingScore);

        // Display correct data on modal
        updateRatingScore(ratingScore, idModalActivity);
        $(idModalActivity + ' h2.heading').text(bookName);
        if (startDate) {
          $(idModalActivity + ' #startDate').val(startDate);
          $(idModalActivity + ' #startDate').removeClass('text-light');
          $(idModalActivity + ' #startDate').addClass('text-primary');
        }
        if (finishDate) {
          $(idModalActivity + ' #finishDate').val(finishDate);
          $(idModalActivity + ' #finishDate').removeClass('text-light');
          $(idModalActivity + ' #finishDate').addClass('text-primary');
        }
      }
    }
  });

  // === Update activity modal === //
  $('body').on('click', idModalActivity + ' .icon-rating', function() {
    var selectedScore = $(this).data('value');
    updateRatingScore(selectedScore, idModalActivity);
    $(idModalActivity + ' ' + idBtnSubmitActivity).data('score', selectedScore);
  });
  $('body').on('click', idModalActivity + ' ' + idBtnSubmitActivity, function() {
    var submitBtnSelector = $(idModalActivity + ' ' + idBtnSubmitActivity);
    var data = {
      bookId: submitBtnSelector.data('book-id'),
      value: submitBtnSelector.data('score'),
      startDate: $(idModalActivity + ' #startDate').val(),
      finishDate: $(idModalActivity + ' #finishDate').val(),
    };

    ratingBook(data);
    toggleModal('modalActivity');
  });
  // === End Update activity modal === //
});
