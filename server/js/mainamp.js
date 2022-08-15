var btnSettings = document.getElementsByClassName('btn-setting');

function postUpdatedSetting(data) {
  var XHR = new XMLHttpRequest();
  XHR.open('POST', window.location.origin + '/user-settings');
  XHR.setRequestHeader('Content-Type', 'application/json');
  XHR.send(JSON.stringify(data));
}

Array.from(btnSettings).forEach(function(element) {
  element.addEventListener('click', function() {
    var name = this.getAttribute('name');
    var value = this.getAttribute('value');
    var data = { name: name, value: value };

    if (name === 'theme') {
      AMP.setState({ darkMode: value === 'dark'});
    }

    postUpdatedSetting(data);
  });
});
