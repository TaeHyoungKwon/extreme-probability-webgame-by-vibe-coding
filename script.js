// Firebase 설정 (실제 사용시 여기에 본인의 Firebase 프로젝트 정보를 입력하세요)
const firebaseConfig = {
    // 여기에 실제 Firebase 프로젝트 정보를 입력하세요
    // apiKey: "your-api-key",
    // authDomain: "your-project.firebaseapp.com",
    // databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    // projectId: "your-project",
    // storageBucket: "your-project.appspot.com",
    // messagingSenderId: "123456789",
    // appId: "your-app-id"
    
    // 임시 테스트용 더미 설정 (실제로는 작동하지 않음)
    apiKey: "demo-api-key",
    authDomain: "demo.firebaseapp.com",
    databaseURL: "https://demo-default-rtdb.firebaseio.com/",
    projectId: "demo",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// 게임 상태 관리
let gameState = {
    currentPlayer: '',
    currentStreak: 0,
    gameCards: [],
    cardSymbols: [],
    isGameActive: false,
    database: null
};

// 음악 상태 관리
let musicState = {
    isPlaying: false,
    isMuted: false,
    audioContext: null,
    oscillator: null,
    gainNode: null,
    bgmAudio: null
};

// Firebase 초기화
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        gameState.database = firebase.database();
        console.log('Firebase 연결 성공');
    } catch (error) {
        console.log('Firebase 연결 실패 (데모 모드로 실행):', error.message);
        // 데모 모드에서는 로컬 스토리지를 랭킹 DB로 사용
        gameState.database = null;
    }
}

// 페이지 로드시 초기화
window.addEventListener('load', function() {
    initFirebase();
    loadPlayerNickname();
    initMusic();
});

// 음악 초기화
function initMusic() {
    // HTML Audio 요소 참조
    musicState.bgmAudio = document.getElementById('bgm');
    
    // BGM 설정
    if (musicState.bgmAudio) {
        musicState.bgmAudio.volume = 0.2; // BGM 볼륨 낮춤
        musicState.bgmAudio.loop = true;
        
        // 음악 로딩 완료 이벤트
        musicState.bgmAudio.addEventListener('canplaythrough', function() {
            console.log('BGM 로딩 완료');
        });
        
        // 음악 재생 시작 이벤트
        musicState.bgmAudio.addEventListener('play', function() {
            musicState.isPlaying = true;
            console.log('BGM 재생 시작');
        });
        
        // 음악 정지 이벤트
        musicState.bgmAudio.addEventListener('pause', function() {
            musicState.isPlaying = false;
            console.log('BGM 정지');
        });
    }
    
    // 로컬 스토리지에서 음악 설정 로드
    const savedMusicState = localStorage.getItem('musicMuted');
    if (savedMusicState === 'true') {
        musicState.isMuted = true;
        updateMusicButton();
    }
}

// Web Audio API로 간단한 배경음 생성
function createAmbientSound() {
    try {
        if (!musicState.audioContext) {
            musicState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 게인 노드 생성 (볼륨 조절용)
        musicState.gainNode = musicState.audioContext.createGain();
        musicState.gainNode.connect(musicState.audioContext.destination);
        musicState.gainNode.gain.setValueAtTime(0.3, musicState.audioContext.currentTime);
        
        // 여러 주파수의 오실레이터로 화음 생성
        const frequencies = [220, 275, 330, 440]; // A3, C#4, E4, A4 (A major chord)
        
        frequencies.forEach((freq, index) => {
            const oscillator = musicState.audioContext.createOscillator();
            const gainNode = musicState.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, musicState.audioContext.currentTime);
            
            // 각 음의 볼륨을 다르게 설정
            gainNode.gain.setValueAtTime(0.02 / (index + 1), musicState.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(musicState.gainNode);
            
            oscillator.start();
            
            // 첫 번째 오실레이터를 메인으로 저장
            if (index === 0) {
                musicState.oscillator = oscillator;
            }
        });
        
        return true;
    } catch (error) {
        console.log('Web Audio API 지원하지 않음:', error);
        return false;
    }
}

// 음악 토글
function toggleMusic() {
    if (musicState.isMuted) {
        unmuteMusic();
    } else {
        muteMusic();
    }
    
    updateMusicButton();
    localStorage.setItem('musicMuted', musicState.isMuted.toString());
}



// 음악 시작
function startMusic() {
    if (musicState.isMuted) return;
    
    console.log('BGM 재생 시도 시작...');
    
    // 실제 BGM 파일 재생
    if (musicState.bgmAudio) {
        console.log('BGM 파일 존재:', musicState.bgmAudio.src);
        console.log('BGM 파일 준비 상태:', musicState.bgmAudio.readyState);
        
        musicState.bgmAudio.volume = 0.2;
        musicState.bgmAudio.currentTime = 0; // 처음부터 재생
        
        musicState.bgmAudio.play().then(() => {
            musicState.isPlaying = true;
            console.log('✅ BGM 재생 성공!');
        }).catch(error => {
            console.log('❌ BGM 재생 실패:', error.message);
            console.log('Error name:', error.name);
            
            // Web Audio로 대체 시도
            console.log('Web Audio로 대체 시도...');
            tryWebAudio();
        });
    } else {
        console.log('❌ BGM 오디오 요소를 찾을 수 없음');
        tryWebAudio();
    }
}

// Web Audio 시도
function tryWebAudio() {
    if (createAmbientSound()) {
        musicState.isPlaying = true;
        console.log('Web Audio 배경음 재생 시작');
    }
}

// 음악 정지
function muteMusic() {
    musicState.isMuted = true;
    
    // BGM 일시정지
    if (musicState.bgmAudio && !musicState.bgmAudio.paused) {
        musicState.bgmAudio.pause();
        console.log('🔇 BGM 일시정지');
    }
    
    // Web Audio 정지
    if (musicState.audioContext && musicState.audioContext.state !== 'suspended') {
        musicState.audioContext.suspend();
        console.log('🔇 Web Audio 일시정지');
    }
    
    musicState.isPlaying = false;
}



// 음악 재개
function unmuteMusic() {
    musicState.isMuted = false;
    
    // BGM 재개
    if (musicState.bgmAudio && musicState.bgmAudio.paused) {
        musicState.bgmAudio.play().then(() => {
            musicState.isPlaying = true;
            console.log('🎵 BGM 재개 성공');
        }).catch(error => {
            console.log('❌ BGM 재개 실패:', error.message);
        });
    }
    
    // Web Audio 재개
    if (musicState.audioContext && musicState.audioContext.state === 'suspended') {
        musicState.audioContext.resume();
    }
    
    // 아직 재생되지 않았다면 새로 시작
    if (!musicState.isPlaying) {
        startMusic();
    }
}

// 음악 버튼 업데이트
function updateMusicButton() {
    const musicIcon = document.getElementById('music-icon');
    const musicBtn = document.getElementById('music-toggle');
    
    if (musicState.isMuted) {
        musicIcon.textContent = '🔇';
        musicBtn.classList.add('muted');
        musicBtn.title = '음악 켜기';
    } else {
        musicIcon.textContent = '🎵';
        musicBtn.classList.remove('muted');
        musicBtn.title = '음악 끄기';
    }
}

// 화면 전환 함수들
function showScreen(screenId) {
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 선택된 화면 보이기
    document.getElementById(screenId).classList.add('active');
}

function showMainScreen() {
    showScreen('main-screen');
    resetGame();
}

function showNicknameScreen() {
    showScreen('nickname-screen');
    document.getElementById('nickname-input').focus();
    
    // 첫 번째 사용자 상호작용에서 음악 시작
    console.log('🎵 첫 번째 사용자 상호작용 - BGM 시작 시도');
    if (!musicState.isMuted && !musicState.isPlaying) {
        startMusic();
    }
}

function showModeScreen() {
    showScreen('mode-screen');
}

function showGameScreen() {
    showScreen('game-screen');
    if (gameState.currentPlayer) {
        document.getElementById('player-nickname').textContent = gameState.currentPlayer;
    }
}

function showRanking() {
    showScreen('ranking-screen');
    loadRanking();
}

// 닉네임 관리
function saveNickname() {
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim();
    
    if (nickname === '') {
        alert('닉네임을 입력해주세요!');
        return;
    }
    
    if (nickname.length > 10) {
        alert('닉네임은 10자 이하로 입력해주세요!');
        return;
    }
    
    gameState.currentPlayer = nickname;
    localStorage.setItem('playerNickname', nickname);
    showModeScreen();
}

function loadPlayerNickname() {
    const savedNickname = localStorage.getItem('playerNickname');
    if (savedNickname) {
        gameState.currentPlayer = savedNickname;
        document.getElementById('nickname-input').value = savedNickname;
    }
}

// 게임 시작
function startSoloMode() {
    resetGame();
    showGameScreen();
    startNewRound();
}

function resetGame() {
    gameState.currentStreak = 0;
    gameState.gameCards = [];
    gameState.cardSymbols = [];
    gameState.isGameActive = true;
    updateStreakDisplay();
    hideGameControls();
    clearGameMessage();
}

// 카드 문양 배열
const cardSymbols = [
    '♠️', '♥️', '♦️', '♣️',  // 트럼프 문양
    '🎯', '🎲', '🎰', '🃏',  // 게임 관련
    '⭐', '💎', '🔥', '✨',  // 반짝이는 것들
    '🎪', '🎭', '🎨', '🎵',  // 예술/엔터테인먼트
    '🚀', '⚡', '🌟', '💫',  // 역동적인 것들
    '🏆', '👑', '💰', '🎊',  // 성공/승리 관련
    '🌙', '🔮', '🎈', '🎁'   // 신비롭고 재미있는 것들
];

function startNewRound() {
    // 카드 생성 (50% 확률로 pass/fail 할당)
    gameState.gameCards = [
        Math.random() < 0.5 ? 'pass' : 'fail',
        Math.random() < 0.5 ? 'pass' : 'fail'
    ];
    
    // 적어도 하나는 pass가 되도록 보장 (게임이 너무 빨리 끝나는 것을 방지)
    if (gameState.currentStreak === 0 && gameState.gameCards.every(card => card === 'fail')) {
        gameState.gameCards[Math.floor(Math.random() * 2)] = 'pass';
    }
    
    // 각 카드에 랜덤 문양 할당
    gameState.cardSymbols = [
        cardSymbols[Math.floor(Math.random() * cardSymbols.length)],
        cardSymbols[Math.floor(Math.random() * cardSymbols.length)]
    ];
    
    // 두 카드가 같은 문양이 나오지 않도록 보장
    while (gameState.cardSymbols[0] === gameState.cardSymbols[1]) {
        gameState.cardSymbols[1] = cardSymbols[Math.floor(Math.random() * cardSymbols.length)];
    }
    
    resetCards();
    clearGameMessage();
    hideGameControls();
    gameState.isGameActive = true;
}

function resetCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.classList.remove('flipped', 'disabled');
        card.style.pointerEvents = 'auto';
        
        // 카드 앞면에 문양 표시
        const cardFront = card.querySelector('.card-front');
        cardFront.textContent = gameState.cardSymbols[index] || '?';
        
        // 카드 뒷면 내용 초기화
        const cardBack = card.querySelector('.card-back');
        cardBack.className = 'card-back';
        cardBack.textContent = '';
    });
}

// 카드 선택
function selectCard(cardIndex) {
    if (!gameState.isGameActive) return;
    
    // 카드 선택 사운드
    playSound('click');
    
    const selectedCard = document.getElementById(`card${cardIndex + 1}`);
    const otherCard = document.getElementById(`card${cardIndex === 0 ? 2 : 1}`);
    const cardResult = gameState.gameCards[cardIndex];
    
    // 카드 비활성화
    gameState.isGameActive = false;
    document.querySelectorAll('.card').forEach(card => {
        card.style.pointerEvents = 'none';
    });
    
    // 선택된 카드 뒤집기
    setTimeout(() => {
        flipCard(selectedCard, cardResult);
    }, 200);
    
    // 다른 카드도 뒤집기 (결과 보여주기)
    setTimeout(() => {
        const otherResult = gameState.gameCards[cardIndex === 0 ? 1 : 0];
        flipCard(otherCard, otherResult);
        otherCard.classList.add('disabled');
    }, 800);
    
    // 결과 처리
    setTimeout(() => {
        handleCardResult(cardResult);
    }, 1500);
}

function flipCard(cardElement, result) {
    cardElement.classList.add('flipped');
    
    const cardBack = cardElement.querySelector('.card-back');
    cardBack.classList.add(result);
    
    if (result === 'pass') {
        cardBack.textContent = '✅ PASS';
    } else {
        cardBack.textContent = '❌ FAIL';
    }
}

function handleCardResult(result) {
    if (result === 'pass') {
        // 성공 사운드
        playSound('success');
        
        gameState.currentStreak++;
        updateStreakDisplay();
        showGameMessage('🎉 성공! 계속하세요!', 'success');
        
        // 성공 애니메이션
        document.getElementById('current-streak').classList.add('bounce');
        setTimeout(() => {
            document.getElementById('current-streak').classList.remove('bounce');
        }, 600);
        
        showContinueButton();
    } else {
        // 실패 사운드
        playSound('fail');
        
        showGameMessage(`💥 실패! 최종 점수: ${gameState.currentStreak}`, 'fail');
        
        // 실패 애니메이션
        document.querySelector('.game-container').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.game-container').classList.remove('shake');
        }, 500);
        
        gameState.isGameActive = false;
        saveScore();
        showRankingButton();
    }
}

function updateStreakDisplay() {
    document.getElementById('current-streak').textContent = gameState.currentStreak;
}

function showGameMessage(message, type) {
    const messageElement = document.getElementById('game-message');
    messageElement.textContent = message;
    messageElement.className = `game-message ${type}`;
}

function clearGameMessage() {
    document.getElementById('game-message').textContent = '';
    document.getElementById('game-message').className = 'game-message';
}

function showContinueButton() {
    document.getElementById('game-controls').style.display = 'block';
    document.getElementById('continue-btn').style.display = 'inline-block';
    document.getElementById('ranking-btn').style.display = 'none';
}

function showRankingButton() {
    document.getElementById('game-controls').style.display = 'block';
    document.getElementById('continue-btn').style.display = 'none';
    document.getElementById('ranking-btn').style.display = 'inline-block';
}

function hideGameControls() {
    document.getElementById('game-controls').style.display = 'none';
}

function nextRound() {
    startNewRound();
}

// 점수 저장
function saveScore() {
    const scoreData = {
        nickname: gameState.currentPlayer,
        score: gameState.currentStreak,
        timestamp: Date.now()
    };
    
    if (gameState.database) {
        // Firebase에 저장
        try {
            gameState.database.ref('rankings').push(scoreData);
            console.log('점수가 Firebase에 저장되었습니다.');
        } catch (error) {
            console.log('Firebase 저장 실패, 로컬 저장으로 전환:', error.message);
            saveScoreLocal(scoreData);
        }
    } else {
        // 로컬 스토리지에 저장 (데모 모드)
        saveScoreLocal(scoreData);
    }
}

function saveScoreLocal(scoreData) {
    let rankings = JSON.parse(localStorage.getItem('gameRankings') || '[]');
    rankings.push(scoreData);
    
    // 점수순으로 정렬하고 상위 100개만 유지
    rankings.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.timestamp - b.timestamp;
    });
    rankings = rankings.slice(0, 100);
    
    localStorage.setItem('gameRankings', JSON.stringify(rankings));
    console.log('점수가 로컬에 저장되었습니다.');
}

// 랭킹 로드
function loadRanking() {
    if (gameState.database) {
        // Firebase에서 로드
        try {
            gameState.database.ref('rankings')
                .orderByChild('score')
                .limitToLast(50)
                .once('value')
                .then(snapshot => {
                    const rankings = [];
                    snapshot.forEach(child => {
                        rankings.push(child.val());
                    });
                    
                    // 점수순으로 정렬
                    rankings.sort((a, b) => {
                        if (b.score !== a.score) {
                            return b.score - a.score;
                        }
                        return a.timestamp - b.timestamp;
                    });
                    
                    displayRanking(rankings);
                })
                .catch(error => {
                    console.log('Firebase 랭킹 로드 실패, 로컬 랭킹 사용:', error.message);
                    loadRankingLocal();
                });
        } catch (error) {
            console.log('Firebase 접근 실패, 로컬 랭킹 사용:', error.message);
            loadRankingLocal();
        }
    } else {
        // 로컬 스토리지에서 로드
        loadRankingLocal();
    }
}

function loadRankingLocal() {
    const rankings = JSON.parse(localStorage.getItem('gameRankings') || '[]');
    displayRanking(rankings);
}

function displayRanking(rankings) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    
    if (rankings.length === 0) {
        rankingList.innerHTML = '<div class="ranking-item"><div>아직 기록이 없습니다.</div></div>';
        return;
    }
    
    // 상위 10개와 현재 플레이어 순위 표시
    const topRankings = rankings.slice(0, 10);
    const currentPlayerRank = rankings.findIndex(rank => rank.nickname === gameState.currentPlayer);
    
    topRankings.forEach((ranking, index) => {
        const rankItem = createRankingItem(ranking, index + 1);
        if (ranking.nickname === gameState.currentPlayer) {
            rankItem.classList.add('current-player');
        }
        rankingList.appendChild(rankItem);
    });
    
    // 현재 플레이어가 상위 10위 밖에 있다면 따로 표시
    if (currentPlayerRank >= 10) {
        const separator = document.createElement('div');
        separator.style.cssText = 'text-align: center; margin: 20px 0; opacity: 0.6;';
        separator.textContent = '...';
        rankingList.appendChild(separator);
        
        const myRanking = rankings[currentPlayerRank];
        const rankItem = createRankingItem(myRanking, currentPlayerRank + 1);
        rankItem.classList.add('current-player');
        rankingList.appendChild(rankItem);
    }
}

function createRankingItem(ranking, position) {
    const rankItem = document.createElement('div');
    rankItem.className = 'ranking-item';
    
    let rankIcon = '🥇';
    if (position === 2) rankIcon = '🥈';
    else if (position === 3) rankIcon = '🥉';
    else if (position <= 10) rankIcon = `${position}위`;
    else rankIcon = `${position}위`;
    
    rankItem.innerHTML = `
        <div class="rank-position">${rankIcon}</div>
        <div class="rank-nickname">${ranking.nickname}</div>
        <div class="rank-score">${ranking.score}점</div>
    `;
    
    return rankItem;
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(event) {
    // 닉네임 입력시 엔터키 처리
    if (event.key === 'Enter') {
        const nicknameScreen = document.getElementById('nickname-screen');
        if (nicknameScreen.classList.contains('active')) {
            saveNickname();
        }
    }
    
    // 게임 중 1, 2 키로 카드 선택
    if (gameState.isGameActive) {
        if (event.key === '1') {
            selectCard(0);
        } else if (event.key === '2') {
            selectCard(1);
        }
    }
});

// 모바일 터치 이벤트 개선
document.addEventListener('touchstart', function() {}, { passive: true });

// BGM 테스트 함수
function testBGM() {
    console.log('🔧 BGM 테스트 시작...');
    console.log('음악 상태:', musicState);
    
    if (musicState.bgmAudio) {
        console.log('📂 BGM 파일 정보:');
        console.log('- src:', musicState.bgmAudio.src);
        console.log('- 준비 상태:', musicState.bgmAudio.readyState);
        console.log('- 일시정지됨:', musicState.bgmAudio.paused);
        console.log('- 음소거됨:', musicState.bgmAudio.muted);
        console.log('- 볼륨:', musicState.bgmAudio.volume);
        console.log('- 길이:', musicState.bgmAudio.duration);
        
        // 강제로 BGM 재생 시도
        musicState.isMuted = false;
        musicState.bgmAudio.volume = 0.2;
        musicState.bgmAudio.currentTime = 0;
        
        musicState.bgmAudio.play().then(() => {
            console.log('✅ BGM 테스트 재생 성공!');
            musicState.isPlaying = true;
            updateMusicButton();
            alert('BGM이 재생되고 있습니다! 들리시나요?');
        }).catch(error => {
            console.log('❌ BGM 테스트 실패:', error);
            alert('BGM 재생 실패: ' + error.message);
        });
    } else {
        console.log('❌ BGM 오디오 요소가 없습니다');
        alert('BGM 오디오 요소를 찾을 수 없습니다. 개발자 도구 콘솔을 확인해주세요.');
    }
}

// 사운드 효과 재생
function playSound(type) {
    if (musicState.isMuted) return;
    
    try {
        if (!musicState.audioContext) {
            musicState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = musicState.audioContext.createOscillator();
        const gainNode = musicState.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(musicState.audioContext.destination);
        
        let frequency = 440;
        let duration = 0.2;
        
        switch(type) {
            case 'click':
                frequency = 800;
                duration = 0.1;
                break;
            case 'success':
                // 성공음: 높은 음에서 더 높은 음으로
                frequency = 600;
                duration = 0.3;
                oscillator.frequency.setValueAtTime(frequency, musicState.audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, musicState.audioContext.currentTime + duration);
                break;
            case 'fail':
                // 실패음: 높은 음에서 낮은 음으로
                frequency = 400;
                duration = 0.5;
                oscillator.frequency.setValueAtTime(frequency, musicState.audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(200, musicState.audioContext.currentTime + duration);
                break;
        }
        
        if (type !== 'success' && type !== 'fail') {
            oscillator.frequency.setValueAtTime(frequency, musicState.audioContext.currentTime);
        }
        
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.3, musicState.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.02, musicState.audioContext.currentTime + duration);
        
        oscillator.start(musicState.audioContext.currentTime);
        oscillator.stop(musicState.audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('사운드 효과 재생 실패:', error);
    }
} 