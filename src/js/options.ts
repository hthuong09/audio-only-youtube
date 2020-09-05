const showThumbnail: any = document.getElementById('show-thumbnail');
const showAudioPlayer: any = document.getElementById('show-audio-player');

// Saves options to chrome.storage
function saveOptions() {
  chrome.storage.sync.set({
    showThumbnail: showThumbnail.checked,
    showAudioPlayer: showAudioPlayer.checked,
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showThumbnail: false,
      showAudioPlayer: true,
    },
    function(items) {
      showThumbnail.checked = items.showThumbnail;
      showAudioPlayer.checked = items.showAudioPlayer;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
showThumbnail.addEventListener('change', saveOptions);
showAudioPlayer.addEventListener('change', saveOptions);
