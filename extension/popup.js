$ = document.getElementById.bind(document);

var postingFormNode = $('posting-form');
var noteNode = $('note');
var noteMirrorNode = document.querySelector('#note-container span');
var shareContainerNode = $('share-container');
var shareCheckboxNode = $('share-checkbox');
var shareLinkNode = $('share-link');
var statusMessageNode = $('status-message');
var statusSubMessageNode = $('status-sub-message');
var changeBGNode = $('change-bg-btn');
var sendKissNode = document.querySelector('.kiss');
var sendHugNode = document.querySelector('.hug');
var moreImagesNode = $('more_images');
var imagesContainer = $('images-container')
var backToMain = $('back_to_main')
var clearImage = $('clear_image')
// var changeBGNode = document.querySelector('.change-bg');
var shareData;
var imagesBefore = -1;

var closingElements = document.querySelectorAll('.close');
for (var i = 0, closingEl; closingEl = closingElements[i]; i++) {
  closingEl.addEventListener('click', closePopup);
}

// Mirror the contents of the text area so that the container node is as big
// as the text's height, which in turn makes the textarea's height be as big as
// its contents. For more details, see
// http://www.alistapart.com/articles/expanding-text-areas-made-elegant/
noteNode.addEventListener('input', function() {
 noteMirrorNode.textContent = noteNode.value;
});
noteMirrorNode.textContent = noteNode.value;

if (window.devicePixelRatio >= 1.5) {
  document.body.classList.add('retina');
}

getSignature(function(signature) {
  postingFormNode.onsubmit = handleFormSubmit.bind(this, signature);
  sendHugNode.onclick = handleSendHug.bind(this, signature);
  sendKissNode.onclick = handleSendKiss.bind(this, signature);
  changeBGNode.onclick = getImages.bind(this, signature);
  moreImagesNode.onclick = getImages.bind(this, signature);
});

backToMain.onclick = function(){
  $('send-to-boo').style.cssText = "display: block;";
  $('change-bg-container').style.cssText = "display: none;";
}

clearImage.onclick = function(){
  window.localStorage.setItem('imageSelected', null);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { method: "clear" }, function(response) {});
  });
}

getShareData(function(loadedShareData) {
  if (!loadedShareData || !loadedShareData.url) {
    shareContainerNode.style.display = 'none';
    return;
  }
  shareData = loadedShareData;
  shareCheckboxNode.checked = true;
  shareLinkNode.href = shareData.url;
  if (shareData.title.length > 35) {
    shareLinkNode.innerText = shareData.title.substring(0, 35) + '…';
  } else {
    shareLinkNode.innerText = shareData.title;
  }
});

function handleSendHug(signature, event){
  event.preventDefault();

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Sent a hug!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };
  xhr.open(
      'POST',
      'https://avocado.io/api/conversation/hug?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send();
}

function handleSendKiss(signature, event){
  event.preventDefault();

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Kissed!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };
  xhr.open(
      'POST',
      'https://avocado.io/api/conversation/kiss?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('x=0.5&y=0.5&rotation=0.2');
}

function handleFormSubmit(signature, event) {
  event.preventDefault();

  var note = noteNode.value;

  if (shareCheckboxNode.checked) {
    note += '\n' + shareData.title + ' - ' + shareData.url;
  }

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    setStatus('Hooray! Sent to Avocado!');
    setTimeout(function() {window.close()}, 1000);
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };

  xhr.open(
      'POST',
      'https://avocado.io/api/conversation?avosig=' + encodeURIComponent(signature),
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('message=' + encodeURIComponent(note));
}

function getImages(signature, event){
  event.preventDefault();

  $('send-to-boo').style.cssText = "display: none;";
  $('change-bg-container').style.cssText = "display: block;";
  
  var url = 'https://avocado.io/api/media?avosig=' + encodeURIComponent(signature);
  url += (imagesBefore === -1) ? '' : '&before=' + imagesBefore;
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    showImages(JSON.parse(xhr.responseText));
  };
  xhr.onerror = function() {
    setStatus('Failure: ' + xhr.responseText);
  };
  xhr.open(
      'GET',
      url,
      true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send();
}

function showImages(images){
  imagesBefore = images[images.length-1].timeCreated;
  
  images.forEach(function(image, index){
    var div = document.createElement('div');
    div.className = "image";
    div.style.cssText = "background: url(" + image.thumbnailUrl + ")";
    imagesContainer.appendChild(div);
    div.onclick = handleImageClick.bind(this,image);
  });
}

function handleImageClick(media, e) {
  if (e.target.nodeName === 'DIV') {
    window.localStorage.setItem('imageSelected', media.imageUrls.large);
    e.target.className += e.target.className ? ' selected' : 'selected';
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { method: "refresh", url: media.imageUrls.large}, function(response) {});
    });
  }
}

function getShareData(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    var tab = tabs[0];
    // During development, the popup is in its own tab, so we use the first
    // tab in the window instead.
    if (tab.url == location.href) {
      chrome.tabs.query({currentWindow: true}, function (tabs) {
        continueWithTab(tabs[0]);
      });
    } else {
      continueWithTab(tab);
    }
  });

  function continueWithTab(tab) {
    callback({url: tab.url, title: tab.title});
  }
}

var SIGNATURE_RE = /var\s+apiSignature\s+=\s+"(.+)";/m;

function closePopup() {
  window.close();
}

function getSignature(callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var match = SIGNATURE_RE.exec(xhr.responseText);
    sign = match[1];
    if (!match) {
      setStatus('Not logged into Avocado',
        'Oopsie, looks like you need to be logged into Avocado before you can send links with Cilantro.');
      var closeButton = document.querySelector('#status .close');
      closeButton.textContent = 'Login';
      closeButton.removeEventListener('click', closePopup);
      closeButton.addEventListener('click', function() {
        window.open('https://avocado.io/login');
      });
      return;
    }

    callback(match[1]);
  };
  xhr.onerror = function() {
    setStatus('Avocado signature XHR error.' + xhr.responseText);
  };
  xhr.open('GET', 'https://avocado.io/=/', true);
  xhr.send();
}

function setStatus(message, opt_subMessage) {
  statusMessageNode.textContent = message;
  if (opt_subMessage) statusSubMessageNode.textContent = opt_subMessage;
  document.body.className = 'has-status';
}
