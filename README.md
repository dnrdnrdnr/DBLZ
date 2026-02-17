# 아이젠하워 계획 다이어리

매일 쏟아내기 + 아이젠하워 매트릭스로 할 일을 정리하는 웹앱입니다.  
**같은 코드**로 브라우저, 데스크톱(Windows/Mac/Linux), 안드로이드에서 실행할 수 있습니다.

## 웹에서 실행

- `index.html`을 브라우저로 열거나, 로컬 서버로 실행하세요.
- 데이터는 브라우저 `localStorage`에 저장됩니다.

## 데스크톱 앱 (Electron, Windows/Mac/Linux)

- **같은** `index.html`, `style.css`, `script.js`를 그대로 사용합니다.
- 실행:
  ```bash
  npm install   # 최초 1회
  npm run desktop
  ```
- 창이 열리며 앱이 실행됩니다. 데이터는 앱 전용 저장 공간에 저장됩니다.
- exe/설치 파일로 배포하려면 `electron-builder` 등으로 패키징할 수 있습니다 (별도 설정).

## 안드로이드 앱 (Capacitor)

### 필요 환경

- Node.js (v18 권장)
- Android Studio
- JDK 17

### 빌드 및 실행

1. **의존성 설치** (최초 1회)
   ```bash
   npm install
   ```

2. **웹 수정 후 앱에 반영**
   - 루트의 `index.html`, `style.css`, `script.js`, `manifest.json`을 수정한 뒤:
   ```bash
   npm run cap:sync
   ```
   - 위 명령이 루트 파일을 `www`로 복사한 다음 Android 프로젝트에 동기화합니다.

3. **Android Studio에서 열기**
   ```bash
   npm run cap:open:android
   ```
   - Android Studio가 열리면 기기/에뮬레이터를 선택하고 Run(▶)으로 앱을 실행하세요.

4. **APK 빌드**
   - Android Studio 메뉴: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### 프로젝트 구조

- `index.html`, `style.css`, `script.js` — 실제 편집하는 웹 소스
- `www/` — Capacitor가 사용하는 웹 에셋 (sync 시 루트에서 복사됨)
- `android/` — Android 네이티브 프로젝트 (Capacitor가 생성)
- `capacitor.config.json` — 앱 ID, 이름, webDir 등 설정

### 앱 ID

- 현재: `com.eisenhower.diary`
- 변경 시 `capacitor.config.json`의 `appId`를 수정한 뒤 `npm run cap:sync`를 다시 실행하세요.
