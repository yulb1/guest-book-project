# Docker 구성 설명

## 1. Docker를 사용하는 이유

Docker를 사용하면 **내 컴퓨터에서 동작하는 환경을, 서버에서 동작하도록 개발환경을 쉽게 컨테이너화 할 수 있습니다.**  
운영체제부터 라이브러리, 실행 환경까지 모든 설정을 '컨테이너'라는 독립된 상자에 담아 배포. 덕분에 복잡한 설치 과정 없이 동일한 서버 환경을 구축할 수 있어 개발 생산성과 배포 안정성이 크게 향상 됩니다.

## 2. Backend Dockerfile 설명

- `FROM amazoncorretto:21`
  - AWS 배포에 최적화된 Java 21 버전의 리눅스 환경(Amazon Corretto)을 베이스 이미지로 가져옵니다.
- `COPY build/libs/*.jar app.jar`
  - 로컬에서 빌드 완료된 Spring Boot 실행 파일(.jar)을 컨테이너 내부로 복사하고, 이름을 'app.jar'로 지정합니다.
- `ENTRYPOINT ["java", "-jar", "/app.jar"]`
  - 컨테이너가 시작될 때 자동으로 실행할 명령어를 설정합니다. 복사해둔 `app.jar`를 실행하여 서버를 구동합니다.

## 3. Frontend Dockerfile 설명

1. **Builder 단계 (빌드 과정)**

   - `node:20-alpine` 환경에서 `npm install`을 통해 필요한 라이브러리를 설치합니다.
   - `npm run build`를 실행하여 소스 코드를 배포 가능한 형태(프로덕션 빌드)로 컴파일합니다.

2. **Runner 단계 (실행 과정)**
   - 실행에 불필요한 개발 도구들을 제외한 가벼운 리눅스 환경을 다시 불러옵니다.
   - Builder 단계에서 생성된 결과물 중, 실제 구동에 필요한 파일들(`standalone`, `public`, `static`)만 선별하여 복사합니다.
   - 최종적으로 `node server.js`를 실행하여 가볍고 빠른 컨테이너를 구동합니다.

## 4. docker-compose 역할

`docker-compose`는 **여러 컨테이너(MySQL, Backend, Frontend)를 하나의 서비스처럼 통합 관리**하는 역할을 합니다.

- **네트워크 연결:** 컨테이너끼리 IP 주소를 몰라도 `mysql`, `backend` 같은 서비스 이름으로 서로 통신할 수 있게 해줍니다.
- **실행 순서 제어:** `depends_on` 설정을 통해 DB가 먼저 켜진 후 백엔드가 켜지도록 순서를 조절하여 연결 오류를 방지합니다.
- **환경 변수 관리:** DB 비밀번호나 API 주소 같은 설정을 한곳에서 관리하여 배포 환경에 맞춰 유연하게 변경할 수 있습니다.
- **단일 명령어 제어:** `docker-compose up -d` 명령어 하나로 전체 시스템을 실행하고 관리할 수 있어 운영이 매우 간편해집니다.
