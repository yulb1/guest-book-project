# Docker 구성 설명

## 1. Docker를 사용하는 이유

Docker를 사용하면 **내 컴퓨터에서 동작하는 환경을, 서버에서 동작하도록 개발환경을 쉽게 컨테이너화 할 수 있다.**  
운영체제부터 라이브러리, 실행 환경까지 모든 설정을 '컨테이너'라는 독립된 상자에 담아 배포. 덕분에 복잡한 설치 과정 없이 동일한 서버 환경을 구축할 수 있어 개발 생산성과 배포 안정성이 크게 향상된다.

## 2. Backend Dockerfile 설명

- `FROM amazoncorretto:21`
  - AWS 배포에 최적화된 Java 21 버전의 리눅스 환경(Amazon Corretto)을 베이스 이미지로 가져온다.
- `COPY build/libs/*.jar app.jar`
  - 로컬에서 빌드 완료된 Spring Boot 실행 파일(.jar)을 컨테이너 내부로 복사하고, 이름을 'app.jar'로 지정.
- `ENTRYPOINT ["java", "-jar", "/app.jar"]`
  - 컨테이너가 시작될 때 자동으로 실행할 명령어를 설정. 복사해둔 `app.jar`를 실행하여 서버를 구동.

## 3. Frontend Dockerfile 설명

1. **Builder 단계 (빌드 과정)**

   - `node:20-alpine` 환경에서 `npm install`을 통해 필요한 라이브러리를 설치.
   - `npm run build`를 실행하여 소스 코드를 배포 가능한 형태(프로덕션 빌드)로 컴파일.

2. **Runner 단계 (실행 과정)**
   - 실행에 불필요한 개발 도구들을 제외한 가벼운 리눅스 환경을 다시 불러온다.
   - Builder 단계에서 생성된 결과물 중, 실제 구동에 필요한 파일들(`standalone`, `public`, `static`)만 선별하여 복사.
   - 최종적으로 `node server.js`를 실행하여 가볍고 빠른 컨테이너를 구동.

## 4. docker-compose 역할 (여러 컨테이너를 함께 실행하는 이유)

`docker-compose`는 여러 개의 컨테이너(Database, Backend, Frontend)가 유기적으로 연결되어 동작해야 하는 애플리케이션을 **하나의 프로젝트처럼 통합 관리**하기 위해 사용.

- **단일 명령어로 제어 (생산성 향상)**

  - 각각의 컨테이너를 매번 `docker run -d -p 8080:8080 ...` 처럼 긴 명령어로 따로 실행할 필요 없이, `docker-compose up` 명령어 하나로 모든 서비스를 한 번에 실행하고 종료할 수 있다.

- **자동화된 네트워크 구성 (연결성)**

  - Docker Compose는 컨테이너 간의 **전용 내부 네트워크**를 자동으로 생성.
  - 복잡한 IP 주소를 알 필요 없이 `mysql`, `backend` 같은 **서비스 이름(Service Name)** 만으로 서로 통신할 수 있어 연결 설정이 매우 간편해진다.

- **설정의 문서화**
  - 포트 포워딩, 볼륨 마운트, 환경 변수 등 복잡한 실행 옵션을 `docker-compose.yml` 파일 하나에 명시하므로, 누가 실행하더라도 **항상 동일한 환경**을 보장할 수 있다.
