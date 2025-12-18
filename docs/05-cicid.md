# CI/CD 파이프라인 설명 (GitHub Actions)

## 1. GitHub Actions를 사용하는 이유

초기에는 로컬에서 코드를 수정하고, 서버에서 접속하여 git 저장소를 클론하고, 빌드 명령어를 입력하는 **수동 배포 방식**을 사용했다.
하지만 이 방식은 반복적이고 번거로우며, 실수할 가능성이 높았다.

이를 해결하기 위해 **GitHub Actions**를 도입.

- **자동화:** 코드를 Push 하는 즉시 배포 과정이 자동으로 시작되어 개발에만 집중할 수 있다.
- **통합 환경:** 별도의 CI/CD 서버(Jenkins 등)를 구축할 필요 없이, 소스 코드가 있는 GitHub 내에서 워크플로우를 관리할 수 있어 효율적.

## 2. 워크플로우 실행 조건

- **Trigger:** `main` 브랜치에 코드가 `push` 되었을 때 실행

## 3. 자동화된 단계별 흐름

1.  **Checkout Code:** GitHub 저장소에 있는 최신 소스 코드를 Runner 환경으로 가져옵니다.
2.  **SSH Connection:** GitHub Secrets에 저장된 `HOST(IP)`, `USERNAME`, `KEY(PEM 파일)` 정보를 사용하여 AWS EC2 서버에 보안 접속.
3.  **Deploy Script Execution (원격 명령어 실행):**
    - `cd guest-book-project`: 프로젝트 폴더로 이동.
    - `git pull origin main`: 깃허브에 올라온 변경 사항을 서버에 내려받음.
    - `./gradlew clean bootJar`: 백엔드(Spring Boot)의 변경 사항을 반영하기 위해 실행 파일(.jar)을 새로 빌드.
    - `docker-compose up -d --build`: 변경된 코드에 맞춰 필요한 컨테이너(Frontend/Backend)만 새로 빌드하고 재시작.
    - `docker image prune -f`: 빌드 과정에서 생긴 불필요한 임시 이미지들을 삭제하여 서버 용량을 관리.

## 4. 트러블 슈팅 (실패 원인과 해결)

### 4-1. 빌드 중 서버 멈춤 현상 (Memory Leak)

- **증상:** GitHub Actions에서 배포가 시작되면 EC2 서버가 응답하지 않고 멈추거나, SSH 접속이 끊기는 현상 발생.
- **원인:** 현재 사용 중인 **EC2 t3.micro** 인스턴스의 RAM은 **1GB**. 하지만 Next.js와 Spring Boot를 동시에 빌드하는 과정에서 메모리 사용량이 1GB를 초과하여 시스템이 강제로 프로세스를 종료(OOM Killer)하거나 멈춘 것으로 파악 됨.
- **해결 방법 (Swap Memory 설정):**
  부족한 RAM을 보완하기 위해 SSD(하드디스크)의 일부를 가상 메모리처럼 사용하는 **스왑 파일(Swap File)** 을 생성. (디스크 속도가 RAM보다 느려 약간의 성능 저하는 있지만, 시스템 멈춤은 방지할 수 있었다.)

  ```bash
  # 1. 2GB 크기의 빈 파일 생성
  sudo fallocate -l 2G /swapfile

  # 2. 파일 권한 수정 (보안)
  sudo chmod 600 /swapfile

  # 3. 해당 파일을 스왑 공간으로 포맷
  sudo mkswap /swapfile

  # 4. 스왑 활성화
  sudo swapon /swapfile

  # 5. 적용 확인 (Swap 영역 생성 확인)
  free -h
  ```

### 4-2. 배포 후 프론트엔드-백엔드 연결 실패 (CORS)

- **증상:** 배포 후 웹 사이트 접속 시, 개발자 도구 콘솔에 CORS 에러 발생.

- **원인:** **Frontend Code: fetch** 주소가 **localhost:8080**으로 되어 있어, 배포 후 사용자의 브라우저에서 백엔드를 찾지 못함.  
  **Backend Config: Spring Boot**의 CORS 설정이 로컬 주소만 허용하도록 제한되어 있음
- **해결:** Frontend: app/page.js의 요청 주소를 EC2 퍼블릭 IP로 변경.
  ```
  [수정 전] fetch('http://localhost:8080/api/guestbooks')
  [수정 후] fetch('http://{인스턴스_퍼블릭_IP}:8080/api/guestbooks')
  ```
  Backend: GuestbookController.java에서 모든 출처 허용으로 변경.
  ```
  [수정 전] @CrossOrigin(origins = "http://localhost:3000")
  [수정 후] @CrossOrigin
  ```

### 4-3. AWS 보안 그룹 이슈

- **증상:** GitHub Actions에서 `Connect to EC2 and Deploy` 단계가 무한 로딩되다가 Timeout 실패.
- **원인:** AWS 보안 그룹에서 SSH(22번) 포트가 '내 IP'로만 제한되어 있어, GitHub 서버의 접근이 차단됨.
- **해결:** SSH 포트의 인바운드 규칙을 `0.0.0.0/0`으로 변경하여 GitHub Actions Runner가 접속할 수 있도록 허용함. (실제 운영 시에는 GitHub IP 대역만 허용하거나 별도 VPN 사용 권장 확인)

### 4-4. DB 실행 전 백엔드 종료 (Race Condition)

- **증상:** docker-compose up 실행 시, MySQL 컨테이너는 켜지지만 백엔드 컨테이너가 즉시 종료(Exit)되는 현상.
- **원인:** MySQL이 초기화되고 구동되는 데 약 30초 이상 걸리는 반면, Spring Boot는 10초 내에 부팅되어 DB 연결을 시도하다가 실패하여 종료됨.
- **해결:** docker-compose.yml 파일의 백엔드 설정에 자동 재시작 옵션을 추가하여, DB가 준비될 때까지 백엔드가 죽더라도 다시 살아나서 연결하도록 처리함.
  ```
  backend:
  # ... 기존 설정 ...
  restart: on-failure  # 추가: 실패 시 자동 재시작
  ```
