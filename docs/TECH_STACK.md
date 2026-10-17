# Guardian Wallet — Technology Stack & Substitution Log

## 1. Frontend & Client Application
- Framework: React 18 with TypeScript (strict mode enabled)
- Build Tool: Vite 5
- Styling: Tailwind CSS 3 (custom fintech dark palette: `#0B0F17` canvas, emerald accents `#10B981`, amber alerts `#F59E0B`, danger red `#EF4444`)
- Icons: Lucide React
- Client Routing & Navigation: Multi-screen state machine with tabbed responsive navigation
- Testing: Vitest 2.1
- Speech Recognition: Web Speech API (`webkitSpeechRecognition` & standard `SpeechRecognition`) with graceful error handling and local fallback

## 2. Mobile / Android Application
- Platform Framework: Capacitor 6 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
- Package ID: `com.guardianwallet.app`
- Target Android SDK: API Level 34 (Android 14)
- Build Tooling: Gradle Wrapper 8.7 & Android Gradle Plugin (AGP)
- Java Runtime: OpenJDK 21 (bundled with Android Studio at `C:\Program Files\Android\Android Studio\jbr`)
- Permissions Configured:
  - `android.permission.RECORD_AUDIO` (microphone access for voice input)
  - `android.permission.MODIFY_AUDIO_SETTINGS`
  - `android.permission.INTERNET`
  - `android.permission.ACCESS_NETWORK_STATE`
  - `android:usesCleartextTraffic="true"` (for local API development and emulator testing)

## 3. Backend API Service
- Runtime: Python 3.13 / 3.11 compatible
- API Framework: FastAPI with Starlette
- Data Schemas: Pydantic v2 (strict type enforcement, decimal strings for currency, no binary floats)
- Web Server: Uvicorn (ASGI)
- Database / Ledger: SQLite with WAL mode (`guardian_wallet.db`)
- Testing: Pytest with HTTPX TestClient
- Blockchain Client: Web3.py with HTTPProvider

## 4. AI & Natural Language Processing
- Architecture: Provider-neutral AI adapter (`AIProviderAdapter`)
- Default Mode: Offline Deterministic Intent Parser (zero external API keys needed)
- Supported Online Providers: OpenAI GPT-4o-mini structured outputs, Google Gemini
- Security Pre-filter: Strict regex prompt-injection & policy-override detector (runs before any LLM inference)

## 5. Blockchain & Smart Contracts
- Target Network: Sepolia EVM Testnet (Chain ID `11155111`)
- Smart Contract Guard: `GuardianPolicyGuard.sol` (Solidity 0.8.20)
- Test Asset: MockERC20 token simulating USDC with 6 decimal places
- Receipt & Event Verification: Cryptographic keccak256 event topic verification (`Transfer(address,address,uint256)`)

## 6. Substitutions & Environmental Notes
- Gradle 8.7: Upgraded from 8.2 to 8.7 to ensure full binary compatibility with OpenJDK 21.
- Local Fallback Engine: Implemented zero-dependency offline client fallback so the prototype functions completely without active internet or third-party cloud services.
