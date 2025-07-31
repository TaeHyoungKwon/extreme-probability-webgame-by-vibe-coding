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
    isGameActive: false,
    database: null
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
});

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
    gameState.isGameActive = true;
    updateStreakDisplay();
    hideGameControls();
    clearGameMessage();
}

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
        
        // 카드 뒷면 내용 초기화
        const cardBack = card.querySelector('.card-back');
        cardBack.className = 'card-back';
        cardBack.textContent = '';
    });
}

// 카드 선택
function selectCard(cardIndex) {
    if (!gameState.isGameActive) return;
    
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