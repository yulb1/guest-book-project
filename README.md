# 나의 개발 다짐 게시판 (Guestbook Project)

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green?style=flat-square&logo=springboot)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat-square&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=flat-square&logo=amazon-aws)

> **"방문자들이 서로의 목표와 다짐을 공유할 수 있는 웹 방명록 서비스"** > 개발부터 클라우드 배포, 그리고 CI/CD 자동화까지 풀스택 개발의 전 과정을 경험하기 위해 제작된 프로젝트입니다.

---

## 아키텍처 (Architecture)

### 🛠️ 기술 스택 (Tech Stack)

| 분류         | 기술                        | 설명                                                   |
| :----------- | :-------------------------- | :----------------------------------------------------- |
| **Frontend** | **Next.js** (Node.js 20)    | SSR/CSR 하이브리드 렌더링, `fetch`를 통한 비동기 통신  |
| **Backend**  | **Spring Boot** (Java 21)   | RESTful API 구현, Spring Data JPA를 이용한 데이터 접근 |
| **Database** | **MySQL 8.0**               | 영구적인 데이터 저장을 위한 RDBMS                      |
| **Infra**    | **AWS EC2** (Amazon Linux)  | 클라우드 컴퓨팅 환경 구축                              |
| **DevOps**   | **Docker & Docker Compose** | 컨테이너 기반의 격리된 실행 환경 구성                  |
| **CI/CD**    | **GitHub Actions**          | 코드 푸시 시 자동 빌드 및 배포 파이프라인 구축         |

### 🔄 시스템 구조

1. **User:** 브라우저를 통해 EC2의 `3000`번 포트(Frontend)에 접속
2. **Frontend:** 화면 렌더링 후, 데이터가 필요할 때 `8080`번 포트(Backend)로 API 요청
3. **Backend:** 비즈니스 로직 처리 후, Docker 내부망을 통해 `3306`번 포트(DB)에 쿼리 실행
4. **Deploy:** GitHub Main 브랜치 푸시 → GitHub Actions 트리거 → EC2 접속 → Docker Compose 재실행

---

## 주요 기능 (Features)

- **방명록 조회 (Read):** 저장된 모든 다짐 목록을 최신순으로 조회.
- **방명록 등록 (Create):** 작성자와 내용을 입력하여 새로운 다짐을 등록.
- **자동 배포 (CI/CD):** 로컬에서 코드를 수정하고 Push하면, 서버에 자동 반영.

---

## 트러블 슈팅 (Troubleshooting)

프로젝트 진행 중 발생한 주요 문제와 해결 과정.

### 1. EC2 서버 멈춤 현상 (Memory Leak)

- **문제:** `t3.micro` (RAM 1GB) 환경에서 Spring Boot와 Next.js 동시 빌드 시 메모리 부족으로 서버 다운.
- **해결:** 리눅스 **Swap Memory**를 2GB 할당하여 부족한 RAM을 디스크 용량으로 대체함.

### 2. CORS (Cross-Origin Resource Sharing) 에러

- **문제:** 배포 후 프론트엔드(`IP:3000`)에서 백엔드(`IP:8080`)로 요청 시 보안 정책에 의해 차단됨.
- **해결:** Spring Boot 컨트롤러에 `@CrossOrigin` 어노테이션을 적용하여 리소스 공유 허용.

### 3. Docker 실행 순서 문제 (Race Condition)

- **문제:** GitHub Actions 워크플로우 실행 중 `Connect to EC2 and Deploy` 단계에서 로그가 멈춰있다가, 결국 시간 초과(Timeout) 또는 `dial tcp ... i/o timeout` 에러로 실패함.
- **해결:** AWS EC2의 **보안 그룹(Security Group)** 설정에서 SSH(22번 포트) 접근 권한이 **'내 IP (My IP)'**로만 제한되어 있었음.  
  AWS 콘솔에서 해당 인스턴스의 보안 그룹 인바운드 규칙을 수정하여 GitHub Actions의 접근을 허용함.
  - **수정 전:** `SSH (22)` | 소스: `내 IP`
  - **수정 후:** `SSH (22)` | 소스: `0.0.0.0/0`

### 4. GitHub Actions 배포 실패 (SSH 접속 Timeout)

- **문제:**
  EC2 배포 후 웹 사이트(`:3000`) 접속 시, 개발자 도구(Console)에 다음과 같은 CORS 에러가 발생하며 데이터 조회가 불가능.
  ```text
  (index):1 Access to fetch at '[http://43.201.xx.xx:8080/api/guestbooks](http://43.201.xx.xx:8080/api/guestbooks)' from origin ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present...
  ```
