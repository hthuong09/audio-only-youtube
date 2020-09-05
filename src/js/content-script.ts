let originalVideoElementStyle: any = null;

async function asyncFind(arr: Array<any>, callback: Function) {
  for (const element of arr) {
    const result = await callback(element);
    if (result) {
      return element;
    }
  }
  return null;
}

async function checkImageLoaded(imageElement: HTMLImageElement) {
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      if (imageElement.complete) {
        clearInterval(intervalId);
        resolve();
      }
    }, 400);
  });
}

async function setBackgroundImage(videoElement: HTMLVideoElement) {
  if (!originalVideoElementStyle) {
    originalVideoElementStyle = {
      background: videoElement.style.background,
      backgroundSize: videoElement.style.backgroundSize,
    };
  }

  let vid = window.location.search.split('v=')[1];
  if (!vid) return;

  const pos = vid.indexOf('&');
  if (pos !== -1) {
    vid = vid.substring(0, pos);
  }

  // https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
  const videoImageUrls = [
    `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${vid}/sddefault.jpg`,
    `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${vid}/0.jpg`,
  ];

  const bgUrl = await asyncFind(videoImageUrls, async (url: string) => {
    const imageElement = new Image();
    imageElement.src = url;
    await checkImageLoaded(imageElement);

    // Placeholder image has width of 120px.
    return imageElement.width !== 120;
  });

  videoElement.style.background = `transparent url(${bgUrl}) no-repeat center / cover`;
}

function showAudioOnlyInformation(videoElement: HTMLVideoElement) {
  if (document.getElementsByClassName('audio_only_div').length === 0) {
    const extensionAlert = document.createElement('div');
    extensionAlert.className = 'audio_only_div';

    const alertText = document.createElement('p');
    alertText.className = 'alert_text';
    alertText.innerHTML =
      'Audio Only. To watch video, ' +
      'click on the extension icon above and refresh your page.';

    extensionAlert.appendChild(alertText);
    const videoParent = videoElement.parentNode;
    if (!videoParent) return;

    const parent = videoParent.parentNode;
    if (parent) {
      parent.appendChild(extensionAlert);
    }
  }
}

function removeBackgroundImage(videoElement: HTMLVideoElement) {
  if (!originalVideoElementStyle) {
    return;
  }

  videoElement.style.background = originalVideoElementStyle.background;
}

function removeAudioOnlyInformation() {
  const elements = document.getElementsByClassName('audio_only_div');
  if (!elements.length) return;
  Array.from(elements).forEach(function(element) {
    element.remove();
  });
}

function removeVideoPlayerStyling(videoElement: HTMLVideoElement) {
  removeBackgroundImage(videoElement);
  removeAudioOnlyInformation();
}

function applyVideoPlayerStyling(videoElement: HTMLVideoElement) {
  chrome.storage.sync.get(
    { showThumbnail: false, showAudioPlayer: true },
    function(item) {
      if (item.showThumbnail) {
        setBackgroundImage(videoElement);
      }
      if (item.showAudioPlayer) {
        turnOnAudioPlayer();
      } else {
        showAudioOnlyInformation(videoElement);
      }
    }
  );
}

function makeSetAudioURL(videoElement: HTMLVideoElement, url: string) {
  function setAudioURL() {
    if (url === '' || videoElement.src === url) {
      return;
    }

    videoElement.pause();
    videoElement.src = url;
    videoElement.currentTime = 0;
    videoElement.play();
  }
  return setAudioURL;
}

function turnOnAudioPlayer() {
  if (window.document.getElementById('audio-player') !== null) {
    return;
  }
  const audioPlayerCSS = `
    #primary-inner #player, #primary-inner .html5-video-player {
      height: 120px!important;
    }

    #player-theater-container:not(:empty) {
      height: 120px!important;
      min-height: 120px!important
    }

    #player-theater-container .caption-window {
      touch-action: none!important;
      text-align: left!important;
      left: 50%!important;
      width: auto!important;
      margin-left: 0!important;
      transform: translateX(-50%);
    }

    #player-theater-container .caption-window span {
      font-size: 2.5rem!important;
    }

    .caption-window {
        margin-bottom: 49px!important;
    }

    .ytp-chrome-bottom {
      opacity: 1!important;
    }
`;
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.id = 'audio-player';
  styleElement.appendChild(document.createTextNode(audioPlayerCSS));
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(styleElement);
}

chrome.runtime.onMessage.addListener((request) => {
  const url = request.url;
  const videoElements = window.document.getElementsByTagName('video');
  const videoElement = videoElements[0];
  if (typeof videoElement == 'undefined') {
    console.log('Audio Only Youtube - Video element undefined in this frame!');
    return;
  }
  const videoRect = videoElement.getBoundingClientRect();
  if (videoRect.width === 0 && videoRect.height === 0) {
    console.log('Audio Only Youtube - Video element not visible!');
    return;
  }

  videoElement.onloadeddata = makeSetAudioURL(videoElement, url);
  if (url) {
    applyVideoPlayerStyling(videoElement);
  } else {
    removeVideoPlayerStyling(videoElement);
  }
});
