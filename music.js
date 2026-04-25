//Dope Lake Maximum The IVth, what are you doing here
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const loopBtn = document.getElementById('loopBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const volLabel = document.getElementById('volLabel');
const muteBtn = document.getElementById('muteBtn');
const songName = document.getElementById('songName');
const songMeta = document.getElementById('songMeta');
const currentTimeEl = document.getElementById('currentTime');
const disk = document.getElementById('spinningDisk');
const canvas = document.getElementById('visualizer');
const playlistEl = document.getElementById('playlist');
const artistName = document.getElementById('artistName');
const artistDesc = document.getElementById('artistDesc');
const artistPfp = document.getElementById('artistPfp');

let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let isMuted = false;
let audioCtx, source, osc;
let currentTracks = [];

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function loadPlaylistFile(src) {
    return new Promise((resolve, reject) => {
        if (!src) return reject('no playlist src');
        const existing = document.getElementById('dynamicPlaylist');
        if (existing) existing.remove();
        window.playlistData = null;
        const script = document.createElement('script');
        script.id = 'dynamicPlaylist';
        script.src = src + '?t=' + Date.now();
        script.onload = () => resolve(window.playlistData);
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function applyPlaylist(data) {
    currentTracks = data.tracks.map((t, i) => ({ ...t, globalIndex: i }));
    artistName.textContent = data.name;
    artistDesc.innerHTML = data.description;
    artistPfp.src = data.pfp || '';

    playlistEl.innerHTML = '';
    const sectionEl = document.createElement('div');
    sectionEl.className = 'mp-playlist-section';
    sectionEl.textContent = data.sectionName || data.name;
    playlistEl.appendChild(sectionEl);

    currentTracks.forEach((track, i) => {
        const item = document.createElement('div');
        item.className = 'mp-playlist-item';
        item.dataset.globalIndex = track.globalIndex;
        item.innerHTML = `
            <span class="mp-item-num">${i + 1}</span>
            <span class="mp-item-name">${track.title}</span>
            <span class="mp-item-duration" id="dur-${track.globalIndex}">—</span>
        `;
        item.addEventListener('click', () => {
            currentIndex = track.globalIndex;
            loadSong(currentIndex);
            playSong();
        });
        playlistEl.appendChild(item);
    });

    currentIndex = 0;
    loadSong(0);
    pauseSong();
}

function loadSong(index) {
    const track = currentTracks[index];
    if (!track) return;
    audio.src = track.src;
    songName.textContent = track.title;
    songMeta.textContent = track.meta || '—';
    disk.src = track.cover || 'https://itzmeunreal.neocities.org/images/icon.png';
    document.querySelectorAll('.mp-playlist-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.globalIndex) === index);
    });
    progressBar.value = 0;
    progressBar.style.setProperty('--progress', '0%');
    currentTimeEl.textContent = '0:00';
}

function setupVisualizer() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(audio);
            source.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const analyser = audioCtx.createAnalyser();
        source.connect(analyser);
        const initFn = (context, width, height) => {
            context.fillStyle = '#0a0a0a';
            context.strokeStyle = '#0066cc';
            context.lineWidth = 2;
        };
        const primerFn = (context, width, height) => {
            context.fillRect(0, 0, width, height);
        };
        if (osc) osc.pause();
        osc = new _osc.Oscilloscope(audioCtx, source, canvas, analyser, 2048, initFn, primerFn);
        osc.start();
    } catch(e) {
        console.warn('Visualizer unavailable:', e);
    }
}

function playSong() {
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    disk.classList.add('playing');
    setupVisualizer();
}

function pauseSong() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    disk.classList.remove('playing');
}

playBtn.addEventListener('click', () => {
    if (isPlaying) { pauseSong(); } else { playSong(); }
});

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + currentTracks.length) % currentTracks.length;
    loadSong(currentIndex);
    playSong();
});

nextBtn.addEventListener('click', () => {
    currentIndex = isShuffle ? Math.floor(Math.random() * currentTracks.length) : (currentIndex + 1) % currentTracks.length;
    loadSong(currentIndex);
    playSong();
});

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
});

loopBtn.addEventListener('click', () => {
    isLoop = !isLoop;
    loopBtn.classList.toggle('active', isLoop);
    audio.loop = isLoop;
});

audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    progressBar.style.setProperty('--progress', pct + '%');
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value;
    volLabel.textContent = Math.round(volumeBar.value * 100);
    volumeBar.style.setProperty('--vol', (volumeBar.value * 100) + '%');
    if (audio.volume === 0) { muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; isMuted = true; }
    else { muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>'; isMuted = false; }
});

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
});

audio.addEventListener('ended', () => {
    if (!isLoop) {
        currentIndex = isShuffle ? Math.floor(Math.random() * currentTracks.length) : (currentIndex + 1) % currentTracks.length;
        loadSong(currentIndex);
        playSong();
    }
});

audio.addEventListener('loadedmetadata', () => {
    const durEl = document.getElementById(`dur-${currentIndex}`);
    if (durEl) durEl.textContent = formatTime(audio.duration);
});

document.querySelectorAll('.mp-artist-grid-item').forEach(item => {
    item.addEventListener('click', () => {
        const src = item.dataset.playlist;
        if (!src) return;
        loadPlaylistFile(src).then(data => {
            applyPlaylist(data);
            document.querySelector('.mp-wrapper').scrollIntoView({ behavior: 'smooth' });
        });
    });
});

volumeBar.style.setProperty('--vol', '70%');
loadPlaylistFile('playlist-sekins.js').then(data => applyPlaylist(data));
