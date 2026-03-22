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

let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let isMuted = false;
let audioCtx, source, osc;

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function buildPlaylist() {
    const playlistEl = document.getElementById('playlist');
    playlistEl.innerHTML = '';
    songs.forEach((section) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'mp-playlist-section';
        sectionEl.textContent = section.name;
        playlistEl.appendChild(sectionEl);

        if (section.description) {
            const desc = document.createElement('div');
            desc.className = 'mp-playlist-desc';
            desc.textContent = section.description;
            playlistEl.appendChild(desc);
        }

        section.tracks.forEach((track, i) => {
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
    });
}

function getAllTracks() {
    return songs.flatMap(s => s.tracks);
}

function loadSong(index) {
    const all = getAllTracks();
    const track = all[index];
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
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const initFn = (ctx, width, height) => {
            ctx.fillStyle = '#0a0a0a';
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
        };

        if (osc) osc.pause();
        osc = new _osc.Oscilloscope(audioCtx, source, canvas, audioCtx.destination, 2048, initFn);
        osc.start();
    } catch(e) {
        console.warn('Visualizer unavailable:', e);
    }
}

function playSong() {
    audio.play();
    isPlaying = true;
    playBtn.textContent = '⏸';
    disk.classList.add('playing');
    setupVisualizer();
}

function pauseSong() {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
    disk.classList.remove('playing');
}

playBtn.addEventListener('click', () => {
    if (isPlaying) { pauseSong(); } else { playSong(); }
});

prevBtn.addEventListener('click', () => {
    const all = getAllTracks();
    currentIndex = (currentIndex - 1 + all.length) % all.length;
    loadSong(currentIndex);
    playSong();
});

nextBtn.addEventListener('click', () => {
    const all = getAllTracks();
    currentIndex = isShuffle ? Math.floor(Math.random() * all.length) : (currentIndex + 1) % all.length;
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
    if (audio.volume === 0) { muteBtn.textContent = '🔇'; isMuted = true; }
    else { muteBtn.textContent = '🔊'; isMuted = false; }
});

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
});

audio.addEventListener('ended', () => {
    if (!isLoop) {
        const all = getAllTracks();
        currentIndex = isShuffle ? Math.floor(Math.random() * all.length) : (currentIndex + 1) % all.length;
        loadSong(currentIndex);
        playSong();
    }
});

audio.addEventListener('loadedmetadata', () => {
    const durEl = document.getElementById(`dur-${currentIndex}`);
    if (durEl) durEl.textContent = formatTime(audio.duration);
});

buildPlaylist();
loadSong(0);
volumeBar.style.setProperty('--vol', '70%');
