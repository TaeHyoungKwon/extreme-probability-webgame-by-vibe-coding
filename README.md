# 🎮 극한의 확률

카드 선택의 극한 긴장감을 경험하는 웹 게임입니다!

## 🎯 게임 소개

2장의 카드 중 하나를 선택하여 최대한 많은 PASS를 연속으로 획득하는 게임입니다. 각 카드는 50% 확률로 PASS 또는 FAIL을 가지고 있으며, FAIL 카드를 선택하면 게임이 종료됩니다.

### 게임 특징
- 🎲 완전한 확률 기반 게임
- 🏆 실시간 랭킹 시스템
- 🎨 아름다운 카드 뒤집기 애니메이션
- 📱 모바일 친화적 반응형 디자인
- ⌨️ 키보드 단축키 지원 (1, 2키로 카드 선택)

## 🚀 게임 실행 방법

### 1. 로컬에서 실행
1. 모든 파일을 다운로드합니다.
2. `index.html` 파일을 웹브라우저에서 엽니다.
3. 데모 모드로 실행됩니다 (랭킹은 로컬 스토리지에 저장됩니다).

### 2. GitHub Pages로 배포
1. GitHub 저장소를 만듭니다.
2. 모든 파일을 업로드합니다.
3. Settings > Pages에서 배포를 활성화합니다.
4. 제공된 URL로 접속하여 게임을 플레이합니다.

## 🔥 Firebase 연동 설정

실시간 랭킹 공유를 위해 Firebase를 설정할 수 있습니다.

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. "프로젝트 추가"를 클릭합니다.
3. 프로젝트 이름을 입력합니다 (예: `extreme-probability-game`).
4. 필요에 따라 Google Analytics를 설정합니다.

### 2. Realtime Database 설정

1. Firebase 콘솔에서 "Realtime Database"를 선택합니다.
2. "데이터베이스 만들기"를 클릭합니다.
3. 테스트 모드로 시작을 선택합니다.
4. 서버 위치를 선택합니다 (아시아-동북부1 권장).

### 3. 웹 앱 등록

1. Firebase 콘솔에서 "프로젝트 개요" > "앱 추가" > "웹" 아이콘을 클릭합니다.
2. 앱 닉네임을 입력합니다 (예: `극한의 확률 웹게임`).
3. Firebase Hosting 설정은 선택사항입니다.
4. "앱 등록"을 클릭합니다.

### 4. 설정 정보 적용

Firebase SDK 설정 정보를 복사하여 `script.js` 파일의 `firebaseConfig` 객체에 적용합니다:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "your-app-id-here"
};
```

### 5. 보안 규칙 설정

Realtime Database의 보안 규칙을 다음과 같이 설정합니다:

```json
{
  "rules": {
    "rankings": {
      ".read": true,
      ".write": true,
      "$rankingId": {
        ".validate": "newData.hasChildren(['nickname', 'score', 'timestamp'])"
      }
    }
  }
}
```

## 🎮 게임 플레이 방법

### 1. 게임 시작
1. "게임 시작" 버튼을 클릭합니다.
2. 닉네임을 입력합니다 (최대 10자).
3. "솔로모드"를 선택합니다.

### 2. 카드 선택
1. 2장의 카드 중 하나를 클릭합니다.
2. 키보드 '1', '2' 키로도 선택 가능합니다.
3. 카드가 뒤집히며 결과가 공개됩니다.

### 3. 게임 진행
- ✅ **PASS**: 연속 성공 횟수가 증가하며 다음 라운드로 진행
- ❌ **FAIL**: 게임 종료, 최종 점수 확정

### 4. 랭킹 확인
게임 종료 후 "내 랭킹 보기"를 클릭하여 전체 랭킹을 확인할 수 있습니다.

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Firebase Realtime Database
- **Hosting**: GitHub Pages (또는 Firebase Hosting)
- **Design**: 모던 글래스모피즘 디자인

## 🎨 주요 기능

### 애니메이션
- 카드 뒤집기 3D 애니메이션
- 성공시 바운스 효과
- 실패시 진동 효과
- 호버 효과 및 버튼 애니메이션

### 사용성
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 키보드 단축키 지원
- 로컬 스토리지 닉네임 저장
- 오프라인 모드 지원

### 랭킹 시스템
- 실시간 순위 업데이트
- 상위 10위 + 개인 순위 표시
- 점수 및 시간 기준 정렬
- 현재 플레이어 하이라이트

## 📁 파일 구조

```
mygame/
├── index.html      # 메인 HTML 파일
├── style.css       # 스타일시트
├── script.js       # 게임 로직
└── README.md       # 프로젝트 설명서
```

## 🔧 개발자를 위한 정보

### 게임 상태 관리
게임은 `gameState` 객체를 통해 상태를 관리합니다:
- `currentPlayer`: 현재 플레이어 닉네임
- `currentStreak`: 현재 연속 성공 횟수
- `gameCards`: 현재 라운드 카드 정보
- `isGameActive`: 게임 활성 상태
- `database`: Firebase 데이터베이스 참조

### 확률 시스템
- 각 카드는 독립적으로 50% 확률을 가집니다.
- 첫 라운드에서 모든 카드가 FAIL인 경우 하나를 PASS로 변경합니다.
- 이는 게임이 즉시 종료되는 것을 방지하기 위함입니다.

### 확장 가능성
기획서에 따라 향후 추가 예정인 모드:
- 하드모드: FAIL 확률 증가
- 타임어택 모드: 제한 시간 내 선택

## 🐛 문제해결

### Firebase 연결 실패
- 네트워크 연결을 확인하세요.
- Firebase 설정 정보가 올바른지 확인하세요.
- 브라우저 콘솔에서 오류 메시지를 확인하세요.

### 게임이 로드되지 않음
- 모든 파일이 같은 폴더에 있는지 확인하세요.
- 브라우저에서 JavaScript가 활성화되어 있는지 확인하세요.
- HTTPS 환경에서 실행하는 것을 권장합니다.

## 📝 라이선스

이 프로젝트는 교육 및 개인 사용 목적으로 자유롭게 사용할 수 있습니다.

---

🎯 **극한의 확률에 도전하세요!** 과연 몇 연속까지 성공할 수 있을까요? 