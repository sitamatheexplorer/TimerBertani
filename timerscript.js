// <APP WINDOW>
const windowWidth = 326;
const windowHeight = 530;
const posX = screen.width - windowWidth;
const posY = screen.height - windowHeight;
window.resizeTo(windowWidth, windowHeight);
window.moveTo(posX, posY);
// </APP WINDOW>
/*	Fungsi diatas akan bekerja dengan cara klik kanan di desktop -> new -> shortcut, isi location itemnya:
	"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///D:\timer.html"
	Contoh jika file timer.html ada di drive D
*/

// Calling All Element
const cryptoWidgetContainer = document.getElementById('crypto-widget-container');
const btnRefreshCrypto = document.getElementById('btn-refresh-crypto');

const btnReward = document.getElementById('btn-reward');
const btnReward1 = document.getElementById('btn-reward1');
const rewardElement = document.getElementById('reward-charge');
const barRewardElement = document.getElementById('reward-charge-bar');

const timerElement = document.getElementById('timercd');
const alarmElement = document.getElementById('alarmcd');
const countdownElement = document.getElementById('countdown');
const sessionElement = document.getElementById('session-counter');
const workingTimeElement = document.getElementById('working-time');
const playTimeElement = document.getElementById('play-time');
const slider = document.getElementById('volumeSlider');
const eleVolume = document.getElementById('aturVolume');
const eleVolumeIn = document.getElementById('volumeIndikator');
const alarmAudio = document.getElementById('alarmAudio');
const btnToggle = document.getElementById('btn-toggle');
const btnClearHistory = document.getElementById('btn-clear-history');

// Fungsi Pembantu Umum
function padZero(num) {
    return num < 10 ? `0${num}` : num;
}

function formatHMS(totalSec) {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

function updateProgressLine(elementId, current, max, tipe = 'cooldown', alertThreshold = 0) {
    const barElement = document.getElementById(elementId);
    if (!barElement)
        return;

    const percentage = tipe === 'cooldown'
         ? (current / max) * 100
         : ((max - current) / max) * 100;

    barElement.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
}

// <W I D G E T>
function coreRefreshWidget() {
    if (!cryptoWidgetContainer)
        return;

    cryptoWidgetContainer.innerHTML = '';
    cryptoWidgetContainer.style.opacity = '0.2';

    const newWidget = document.createElement('div');
    newWidget.className = 'coinmarketcap-currency-widget';
    const widgetAttrs = {
        'data-currencyid': '36044',
        'data-base': 'IDR',
        'data-secondary': 'USD',
        'data-ticker': 'true',
        'data-rank': 'false',
        'data-marketcap': 'false',
        'data-volume': 'false',
        'data-statsticker': 'false',
        'data-stats': 'USD'
    };

    for (const [key, val] of Object.entries(widgetAttrs)) {
        newWidget.setAttribute(key, val);
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://files.coinmarketcap.com/static/widget/currency.js';
    script.onload = () => {
        cryptoWidgetContainer.style.opacity = '1';
    };

    cryptoWidgetContainer.appendChild(script);
    cryptoWidgetContainer.appendChild(newWidget);
}

const WIDGET_AUTO_DURATION = 30;
let widgetAutoSeconds = WIDGET_AUTO_DURATION;

function updateWidget() {
    widgetAutoSeconds--;
    updateProgressLine('widget-auto-bar', widgetAutoSeconds, WIDGET_AUTO_DURATION, 'cooldown');

    if (widgetAutoSeconds <= 0) {
        widgetAutoSeconds = WIDGET_AUTO_DURATION;
        coreRefreshWidget();
    }
}

function refreshCryptoWidget() {
    if (widgetAutoSeconds > 4 && widgetAutoSeconds < WIDGET_AUTO_DURATION - 3) {
        coreRefreshWidget();

        btnRefreshCrypto.style.opacity = '0.5';
        btnRefreshCrypto.disabled = true;
        let cooldown = 7;

        btnRefreshCrypto.textContent = `Cooldown sek (${cooldown}s)`;

        const cooldownInterval = setInterval(() => {
            cooldown--;
            if (cooldown <= 0) {
                clearInterval(cooldownInterval);
                btnRefreshCrypto.disabled = false;
                btnRefreshCrypto.textContent = "Kuchiyose No Jutsu";
                btnRefreshCrypto.style.opacity = '1';
            } else {
                btnRefreshCrypto.textContent = `Cooldown sek (${cooldown}s)`;
            }
        }, 1000);
    }
}

btnRefreshCrypto.addEventListener('click', refreshCryptoWidget);
// </W I D G E T>

// <T I M E R>
let SESSION_DURATION = Number(timerElement.value) || 120;
let ALARM_TRIGGER_SECONDS = Number(alarmElement.value) || 15;

let totalSeconds = SESSION_DURATION;
let totalWorkingTime = 0;
let totalPlayTime = 0;
let sessionCount = 0;
let timerInterval = null;
let isRunning = false;

function formatTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    countdownElement.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
}

alarmAudio.volume = Number(slider.value);
eleVolumeIn.textContent = Math.round(Number(slider.value) * 100);

let isPlaying = false;
let fadeInterval = null;
let sharedAudioCtx = null; // Satu instance audio agar hemat RAM

slider.addEventListener('input', function () {
    alarmAudio.volume = Number(this.value);
    eleVolumeIn.textContent = Math.round(Number(this.value) * 100);
});

function handleVolumeWheel(event) {
    event.preventDefault();
    const step = parseFloat(slider.step) || 0.1;
    let currentValue = parseFloat(slider.value);

    if (event.deltaY < 0) {
        slider.value = Math.min(currentValue + step, 1);
    } else {
        slider.value = Math.max(currentValue - step, 0);
    }

    slider.dispatchEvent(new Event('input'));
}

eleVolume.addEventListener('wheel', handleVolumeWheel, {
    passive: false
});

eleVolumeIn.addEventListener('wheel', handleVolumeWheel, {
    passive: false
});

function playAlarm() {
    if (!isPlaying) {
        isPlaying = true;
        alarmAudio.play().catch(err => console.log("Menunggu interaksi pengguna:", err));
    }
}

function stopAlarm() {
    clearInterval(fadeInterval);
    isPlaying = false;

    fadeInterval = setInterval(() => {
        if (alarmAudio.volume > 0.1) {
            alarmAudio.volume = Math.max(0, alarmAudio.volume - 0.1);
        } else {
            clearInterval(fadeInterval);
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            alarmAudio.volume = Number(slider.value);
        }
    }, 50);
}

function updateTimer() {
    totalWorkingTime++;
    totalPlayTime++;
    workingTimeElement.textContent = formatHMS(totalWorkingTime);
    playTimeElement.textContent = formatHMS(totalPlayTime);

    totalSeconds--;

    if (totalSeconds <= ALARM_TRIGGER_SECONDS && totalSeconds > 0) {
        playAlarm();
        countdownElement.style.color = "#e74c3c";
    } else {
        stopAlarm();
    }

    if (totalSeconds < 0) {
        sessionCount++;
        sessionElement.textContent = `#${sessionCount} Rotasi`;
        countdownElement.style.color = "#2c3e50";
        totalSeconds = SESSION_DURATION;
    }

    formatTimerDisplay();
}

timerElement.addEventListener('change', () => {
    SESSION_DURATION = Number(timerElement.value);
    totalSeconds = SESSION_DURATION;
    formatTimerDisplay();
});

alarmElement.addEventListener('change', () => {
    ALARM_TRIGGER_SECONDS = Number(alarmElement.value);
    formatTimerDisplay();
});
// </T I M E R>

// <R E W A R D>
const REWARD_CHARGE_DURATION = 1200;
let rewardChargeSeconds = REWARD_CHARGE_DURATION;
let muteReward = false;

function playAlarmReward() {
    if (!sharedAudioCtx) {
        sharedAudioCtx = new(window.AudioContext || window.webkitAudioContext)();
    }
    if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
    }

    const oscillator = sharedAudioCtx.createOscillator();
    const gainNode = sharedAudioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(sharedAudioCtx.destination);

    const now = sharedAudioCtx.currentTime;
    let duration = 0;

    for (let i = 0; i < 2; i++) {
        oscillator.frequency.linearRampToValueAtTime(300, now + duration);
        duration += 0.2;
        oscillator.frequency.linearRampToValueAtTime(600, now + duration);
        duration += 0.3;
    }

    gainNode.gain.setValueAtTime(0.1, now);
    oscillator.start(now);
    oscillator.stop(now + duration);
}

function setRewardMuteState(isMuted) {
    muteReward = isMuted;
    if (isMuted) {
        btnReward.textContent = '🔇';
        btnReward.className = "button-reward-m";
        barRewardElement.style.backgroundColor = '#6c757d';
    } else {
        btnReward.textContent = '🔊';
        btnReward.className = "button-reward";
        barRewardElement.style.backgroundColor = '#3498db';
    }
}

btnToggle.addEventListener('click', () => {
    getRewardCooldown();
    SESSION_DURATION = Number(timerElement.value);
    ALARM_TRIGGER_SECONDS = Number(alarmElement.value);
    totalSeconds = SESSION_DURATION;

    if (!isRunning) {
        timerInterval = setInterval(updateTimer, 1000);
        btnToggle.textContent = "Rehat Sek!";
        btnToggle.className = "btn-pause";
        countdownElement.style.color = "#2c3e50";
        isRunning = true;
        setRewardMuteState(true);
        totalPlayTime = 0;
    } else {
        playTimeElement.textContent = formatHMS(totalPlayTime);
        stopAlarm();
        clearInterval(timerInterval);
        totalSeconds = SESSION_DURATION;
        btnToggle.textContent = "Kanjut Mang!";
        btnToggle.className = "btn-play";
        countdownElement.style.color = "#2c3e50";
        isRunning = false;
        setRewardMuteState(false);
        formatTimerDisplay();
    }
});

btnClearHistory.addEventListener('click', () => {
    if (totalWorkingTime > 1) {
        clearInterval(timerInterval);
        totalSeconds = SESSION_DURATION;
        totalWorkingTime = 0;
        totalPlayTime = 0;
        sessionCount = 0;
        isRunning = false;
        formatTimerDisplay();
        workingTimeElement.textContent = formatHMS(0);
        playTimeElement.textContent = formatHMS(0);
        sessionElement.textContent = Rotasi;
        btnToggle.textContent = "Kanjut Mang..!";
        btnToggle.className = "btn-play";
        countdownElement.style.color = "#2c3e50";
    }
});

function updateReward() {
    rewardChargeSeconds--;
    const minutes = Math.floor(rewardChargeSeconds / 60);
    const seconds = rewardChargeSeconds % 60;

    rewardElement.textContent = `${padZero(minutes)}:${padZero(seconds)}`;

    updateProgressLine('reward-charge-bar', rewardChargeSeconds, REWARD_CHARGE_DURATION, 'cooldown');

    if (!muteReward && !isRunning && rewardChargeSeconds <= 10) {
        playAlarmReward();
    }
    if (rewardChargeSeconds <= 0) {
        rewardChargeSeconds = REWARD_CHARGE_DURATION;
    }
}

function getRewardCooldown() {
    const sekarang = new Date();
    const totalMenit = (sekarang.getHours() * 60) + sekarang.getMinutes();
    const posisiMenit = totalMenit % 20;
    const detikSekarangDiSiklus = (posisiMenit * 60) + sekarang.getSeconds();
    rewardChargeSeconds = 1200 - detikSekarangDiSiklus;
}

btnReward1.addEventListener('click', getRewardCooldown);

btnReward.addEventListener('click', () => {
    getRewardCooldown();
    setRewardMuteState(!muteReward);
});
// </R E W A R D>


// Inisialisasi Awal
getRewardCooldown();
formatTimerDisplay();
workingTimeElement.textContent = formatHMS(0);
playTimeElement.textContent = formatHMS(0);

setInterval(() => {
    updateWidget();
    updateReward();
}, 1000);