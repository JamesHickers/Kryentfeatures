<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discord-style Multi Video Player</title>

<!-- External CSS for Plyr -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

<style>
  body {
    background: #36393f;
    font-family: sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    color: #fff;
  }

  .file-input {
    margin-bottom: 20px;
    padding: 8px 12px;
    background: #7289da;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  }

  .video-feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 800px;
  }

  .video-wrapper {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #2f3136;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }

  .plyr--full-ui input[type="range"]::-webkit-slider-thumb {
    background: #7289da;
  }
</style>
</head>
<body>

<h2>Discord-style Multi Video Player</h2>
<input type="file" id="fileInput" class="file-input" accept="video/*" multiple />

<div class="video-feed" id="videoFeed"></div>

<!-- External Scripts -->
<script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>

<script>
const fileInput = document.getElementById('fileInput');
const videoFeed = document.getElementById('videoFeed');

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => addPlyrVideo(file));
});

function addPlyrVideo(file) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const video = document.createElement('video');
  video.src = URL.createObjectURL(file);
  video.controls = true;
  video.playsInline = true; // for mobile
  video.muted = true;       // auto play safe
  video.autoplay = false;

  wrapper.appendChild(video);
  videoFeed.appendChild(wrapper);

  // Initialize Plyr on this video
  const player = new Plyr(video, {
    controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
    ratio: '16:9',
    hideControls: true, // Discord-style hover controls
  });

  // Optional: automatically scale video wrapper to container width
  wrapper.style.width = '100%';
}
</script>

</body>
</html>
