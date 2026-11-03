# 추가 개념: SQL을 공부하기 전에

SQLD 본문을 이해하기 위한 배경 설명이다. 제품 비교·클라우드 서비스·Firebase는 시험 핵심 단원과 구분한다. 기존 1·2과목의 학습 순서는 그대로 따라가면 된다.

## SQLD와 어디까지 연결될까?

| 학습 내용 | 이 사이트의 구분 | 공부할 깊이 |
|---|---|---|
| DB·DBMS·RDBMS·SQL의 의미 | 시험 이해의 기초 | 서로 무엇이 다른지 설명하기 |
| 엔터티·속성·관계·식별자·PK/FK | 시험 핵심과 직접 연결 | 표와 관계를 보고 판단하기 |
| SELECT·JOIN·NULL·집계·트랜잭션 | 시험 핵심과 직접 연결 | SQL 결과를 직접 계산하기 |
| 제품별 특징·관리 도구 비교 | 추가 배경 | 언어·제품·도구를 구분하기 |
| Firebase·클라우드 운영 방식 | 추가 배경 | 어떤 종류의 서비스인지 이해하기 |

위 구분은 학습 우선순위 안내이며 출제 보장이 아니다. 공식 범위는 [데이터자격검정 SQL 개발자 안내](https://www.dataq.or.kr/www/sub/a_04.do)에서 확인한다. 현재 공식 페이지의 자동 접근 제한으로 최신 세부 항목 전체를 이 페이지와 대조하지는 못했다. 제품별 우열·요금제 암기는 이 자료의 SQLD 학습 목표가 아니다.

## DB, DBMS, SQL은 서로 다른 것

- **DB — Database, 데이터베이스:** 학생·수강·과목처럼 관련된 정보를 체계적으로 보관한 데이터의 집합.
- **DBMS — Database Management System, 데이터베이스 관리 시스템:** DB를 저장·조회·변경하고 권한·동시 작업·복구 등을 관리하는 소프트웨어.
- **RDBMS — Relational DBMS, 관계형 DBMS:** 데이터를 관계형 모델로 다루는 DBMS. 테이블·키·제약조건 등을 사용한다.
- **SQL — Structured Query Language, 구조화 질의 언어:** 관계형 데이터를 정의·조회·변경하고 권한 등을 다룰 때 사용하는 언어.

**SQL은 언어이고, MySQL·Oracle Database는 그 언어를 처리하는 제품이다.**

도서관에 비유하면 DB는 정리된 장서·대여 기록, DBMS는 기록을 관리하는 시스템, SQL은 “남쪽 지점의 대여료 합계를 보여줘”라는 요청을 적는 방식에 가깝다. 실제 DBMS는 저장 외에도 규칙 검사와 동시 접근을 처리한다.

참고: [Oracle의 DB·DBMS·SQL 설명](https://www.oracle.com/database/what-is-database/).

## DBMS가 실제로 하는 일

대여료를 변경하는 요청 하나에도 여러 기능이 필요하다.

1. **접근 권한 — Authorization:** 이 사용자가 변경할 수 있는가?
2. **구문 해석·실행 — Query processing:** 문장이 맞는가, 어떤 데이터를 찾을 것인가?
3. **무결성 검사 — Integrity constraints:** 존재하지 않는 학생을 참조하거나 PK가 중복되지 않는가?
4. **동시성 제어 — Concurrency control:** 두 사람이 같은 마지막 좌석을 동시에 신청하면 어떻게 처리하는가?
5. **확정·복구 — Transaction / Recovery:** 변경을 함께 확정하고, 실패·장애 시 일관성을 어떻게 지키는가?

DBMS를 쓴다고 업무 규칙이 저절로 정해지지는 않는다. 설계자가 키·제약조건·트랜잭션 경계를 올바르게 정의해야 한다.

## 테이블은 스프레드시트와 무엇이 다를까?

둘 다 행과 열로 볼 수 있지만, RDBMS의 테이블에는 자료형과 제약조건을 정의하고 여러 사용자의 작업을 관리할 수 있다.

| 용어 | 영어 | 학생 테이블 예 |
|---|---|---|
| 테이블 | Table | STUDENT 전체 |
| 행 / 레코드 | Row / Record | 학생번호 101인 학생 한 명의 기록 |
| 열 / 컬럼 | Column | student_id, student_name |
| 스키마 | Schema | 어떤 테이블·열·관계가 있는지 정한 구조 |
| 쿼리 | Query | 필요한 결과를 요청하는 문장 |
| 결과 집합 | Result set | 쿼리를 실행해 얻은 행과 열 |

물리적인 행 저장 순서와 화면 출력 순서를 혼동하지 않는다. 순서가 필요하면 ORDER BY로 요청한다.

## SQL 한 문장을 읽어보기

```sql
SELECT branch_id, SUM(fee) AS fee_sum
FROM loan
WHERE fee IS NOT NULL
GROUP BY branch_id;
```

- **FROM:** 대여 기록 LOAN에서 가져온다.
- **WHERE:** 금액이 확정된 행만 남긴다.
- **GROUP BY:** 지점별로 묶는다.
- **SELECT:** 지점번호와 대여료 합계를 결과 열로 보여준다.

SQL은 보통 “어떤 결과가 필요한가”를 적는 선언형 언어다. 내부에서 어떤 인덱스나 접근 순서를 사용할지는 DBMS가 실행 계획으로 결정할 수 있다. 작성 순서와 논리적 해석 순서가 다르다는 점은 2과목에서 연습한다.

## 회사·프로젝트별 DBMS 비교

제품 이름에 SQL이 들어가도 SQL 언어 자체와 같은 뜻은 아니다. 아래는 기본 성격을 비교한 것이며 속도 순위나 구매 추천이 아니다.

| 제품 | 개발·관리 주체 | 기본 특징 | 구별할 이름 |
|---|---|---|---|
| Oracle Database | Oracle | 서버형 관계형 DBMS. Oracle SQL과 PL/SQL 생태계 | SQL Developer는 접속·개발 도구 |
| MySQL | Oracle | 오픈소스 관계형 DBMS. 커뮤니티·상용 배포가 있음 | MySQL Workbench는 관리 도구 |
| PostgreSQL | PostgreSQL Global Development Group와 커뮤니티 | 오픈소스 객체관계형 DBMS. 확장 기능을 제공 | pgAdmin은 관리 도구 |
| Microsoft SQL Server | Microsoft | 관계형 DBMS. T-SQL을 사용 | SSMS는 관리 도구 |
| SQLite | SQLite 프로젝트 | 앱 프로세스 안에서 동작하는 내장형 SQL 엔진. 별도 DB 서버가 필요 없음 | SQLite도 SQL을 사용 |

PostgreSQL·SQLite는 한 회사가 출시한 상용 제품으로만 설명하기 어렵다. 또한 오픈소스 소프트웨어라는 사실과 클라우드에서 운영할 때 비용이 발생하는지는 별개다.

공식 자료: [Oracle Database](https://www.oracle.com/database/), [MySQL](https://dev.mysql.com/doc/refman/8.4/en/what-is-mysql.html), [PostgreSQL](https://www.postgresql.org/about/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/what-is-sql-server?view=sql-server-ver17), [SQLite](https://www.sqlite.org/about.html).

## 같은 SQL인데 왜 문법이 다를까?

공통 표준을 바탕으로 각 DBMS가 문법·함수·자료형을 확장하기 때문이다. 제품별 차이를 **SQL 방언 — SQL dialect**이라고 부른다.

| 하고 싶은 일 | Oracle 19c 예 | SQL Server 예 |
|---|---|---|
| NULL을 다른 값으로 대체 | `NVL(fee, 0)` | `ISNULL(fee, 0)` |
| 두 환경에서 쓰는 대체 표현 | `COALESCE(fee, 0)` | `COALESCE(fee, 0)` |
| 정렬 후 상위 두 행 | `ORDER BY ... FETCH FIRST 2 ROWS ONLY` | `SELECT TOP (2) ... ORDER BY ...` |

비슷한 함수라도 반환 자료형·인수 평가 방식까지 완전히 같은 것은 아니다. 이 사이트는 Oracle 구문을 사용할 때 환경을 표시하고, SQL Server 차이를 함께 설명한다.

참고: [Oracle SQL 언어](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Introduction-to-Oracle-SQL.html), [Microsoft T-SQL](https://learn.microsoft.com/en-us/sql/t-sql/language-reference?view=sql-server-ver17).

## DBMS, 접속 도구, 클라우드 서비스 구별하기

- **DBMS:** SQL을 해석하고 데이터를 관리하는 엔진. 예: PostgreSQL.
- **접속·관리 도구 — Database client:** 사람이 DB에 접속해 쿼리를 작성하고 결과를 보는 프로그램. 예: pgAdmin·SSMS·SQL Developer. 여러 엔진을 지원하는 도구도 있다.
- **관리형 DB 서비스 — Managed database service:** 제공자가 DB 운영 작업의 일부를 맡는 서비스. 예: Amazon RDS, Google Cloud SQL, Azure SQL Database. 제공 기능과 엔진 호환성은 서비스마다 다르다.

예를 들어 “Cloud SQL에서 PostgreSQL을 운영하고, pgAdmin으로 접속해 SQL을 실행한다”는 세 이름은 서로 다른 역할이다. 내 컴퓨터의 관리 도구를 닫는 것과 서버 DB를 중지하는 것도 다른 일이다.

참고: [Google Cloud SQL](https://cloud.google.com/sql/docs/introduction), [Amazon RDS](https://aws.amazon.com/rds/), [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql).

## Firebase와 SQL은 어떻게 다를까?

**Firebase는 언어가 아니라 Google의 앱 개발 플랫폼이다.** 로그인·데이터 저장 등 여러 제품을 묶어 제공한다. 따라서 “SQL 대 Firebase”보다 “관계형 DB와 Firestore의 데이터 모델 비교”처럼 대상을 맞추는 편이 정확하다.

| 대상 | 무엇인가? | 데이터를 이해하는 기본 단위 |
|---|---|---|
| SQL | 데이터를 다루는 언어 | 문장·조회·변경 요청 |
| PostgreSQL 등 RDBMS | 관계형 데이터 관리 엔진 | 테이블·행·열·키 |
| Firebase | 앱 개발 플랫폼 | 여러 백엔드 제품의 묶음 |
| Cloud Firestore | Firebase에서 사용할 수 있는 NoSQL DB | 컬렉션·문서·필드 |
| Firebase SQL Connect | PostgreSQL 기반 관계형 DB 서비스 | 관계형 스키마와 앱용 작업·SDK |

### 동일한 정보를 저장하는 두 관점

- **관계형 예:** STUDENT 테이블과 ENROLLMENT 테이블을 나누고 student_id로 연결한다. 필요한 조회에서 JOIN을 사용할 수 있다.
- **문서형 예:** `students/101` 문서에 이름을 두고 별도의 수강 컬렉션 또는 하위 컬렉션을 설계한다. 자주 필요한 읽기와 데이터 갱신 방식을 고려한다.
- 문서형이라고 관계가 없는 것은 아니고, NoSQL이라고 트랜잭션이 없는 것도 아니다. Firestore도 트랜잭션을 지원한다. 관계 표현과 질의 방식이 다르다.

**Firebase 전체를 NoSQL이라고 단정하면 틀리다.** 공식 문서에는 PostgreSQL 기반 **SQL Connect**도 있다. 과거 **Data Connect**라는 이름으로 소개된 자료가 있어 이름을 함께 알아두면 좋다. Cloud Firestore는 별도의 문서형 NoSQL 제품이다.

참고: [Firebase 플랫폼](https://firebase.google.com/docs), [Cloud Firestore](https://firebase.google.com/docs/firestore), [Firebase SQL Connect](https://firebase.google.com/docs/sql-connect), [Data Connect에서 SQL Connect로의 명칭 변경](https://firebase.blog/posts/2026/04/whats-new-sql-connect). 제품명과 특징 확인 기준: 2026-11-04. 이 페이지는 비교 설명만 제공하며 Firebase나 유료 클라우드 자원을 생성하지 않는다.

## 다음에 무엇을 공부하면 될까?

1. DB는 데이터, DBMS는 관리 프로그램, SQL은 언어라는 차이를 말해본다.
2. 학생 한 명의 행에서 PK를 찾고 수강 행의 FK가 누구를 가리키는지 본다.
3. 1과목에서는 대상·관계·식별자를, 2과목에서는 조건을 통과하는 행과 결과값을 연습한다.

제품 비교와 Firebase 설명은 추가 배경이다. SQLD 공부 시간에는 엔터티·식별자·정규화·NULL·JOIN·집계·트랜잭션에 우선순위를 둔다.

## DBMS는 어떤 방법으로 데이터를 찾을까?

실행 계획은 데이터를 어떤 순서와 방식으로 접근·결합할지 보여준다. 통계와 데이터 분포가 달라지면 계획도 달라질 수 있다. 논리적으로 같은 결과의 두 SQL이 항상 같은 비용으로 실행되는 것은 아니다.

인덱스 컬럼에 함수를 씌우면 일반 인덱스 활용이 어려워질 수 있으나 함수 기반 인덱스 등 예외가 있다. ‘인덱스가 있으면 반드시 사용한다’ 또는 ‘전체 스캔은 항상 나쁘다’ 같은 절대 규칙 대신 계획과 실제 측정을 확인한다.

[Oracle 실행 계획 안내](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/generating-and-displaying-execution-plans.html)
