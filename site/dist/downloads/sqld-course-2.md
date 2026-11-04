# SQL 읽기: 입력 행에서 결과 표까지

이 자료는 개념 설명·가상 데이터·연습문제를 새로 작성한 SQL 학습 노트다. 특정 강의의 대본·교재를 재현하지 않는다. 기본 SELECT 예시는 여러 DBMS에서 이해할 수 있는 구문을 사용하고, 차이가 있는 구문에는 DBMS를 표시한다. 공식 시험 안내·교재를 대체하는 전 범위 수험서는 아니다.

**학습 방법:** 2단원의 실습 표를 옆에 두고, 쿼리가 남기는 행을 손으로 적은 뒤 설명을 확인한다. 같은 이름의 함수라도 DBMS와 버전에 따라 세부 동작이 다를 수 있다.

## 1 SQL 문장을 역할로 나누기

**핵심 한 줄:** 조회·데이터 변경·구조 변경·권한·확정은 서로 다른 작업이다.

### 강사가 짚은 시험 포인트

**SQL 명령의 분류** · [강의 02:46](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=166s)

강사는 명령을 보고 역할을 구별하는 연습을 강조한다. 행을 지우는 DELETE는 DML, 표 자체를 지우는 DROP은 DDL, 권한을 주는 GRANT는 DCL이다.

**관계대수 복습 순서** · [강의 06:20](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=380s)

강사는 관계대수를 낮은 빈도로 언급하며 SQL을 익힌 뒤 복습하라고 한다. 셀렉션은 행을, 프로젝션은 열을 고른다.

[강의 04:46 · 관계대수](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=286s)

행 선택(Selection)은 조건을 만족하는 행을 남기고, 열 선택(Projection)은 필요한 속성만 남긴다. 두 행과 세 행을 조건 없이 곱하면 여섯 조합이다. 그중 두 키가 일치하는 조합만 남기는 것이 등가 조인을 이해하는 출발점이다.

### 강의 개념 정리

관계대수에서 셀렉션은 행, 프로젝션은 열을 고른다. 카티션 곱은 두 입력의 모든 행 조합을 만들고 조인은 조건에 맞는 조합을 연결한다. SQL 문장은 조회·변경, 구조 정의, 트랜잭션, 권한 중 무엇을 다루는지로 구별한다.

| 분류 | 목적 | 예 |
|---|---|---|
| 조회 및 데이터 조작 | 값을 읽거나 행을 바꿈 | SELECT, INSERT, UPDATE, DELETE, MERGE |
| 구조 정의 | 테이블 등 객체를 정의 | CREATE, ALTER, DROP, TRUNCATE |
| 권한 제어 | 허용할 작업을 정함 | GRANT, REVOKE |
| 트랜잭션 제어 | 변경을 확정·취소 | COMMIT, ROLLBACK, SAVEPOINT |

SELECT를 DML에 포함하거나 DQL로 따로 부르는 분류가 있다. 명칭보다 해당 문장이 실제로 무엇을 바꾸는지 이해하자.

관계대수에서 셀렉션은 조건에 맞는 행을 고르는 연산이고 프로젝션은 필요한 속성을 고르는 연산이다. SQL은 기본적으로 중복 행을 유지할 수 있으므로 집합 모델과 항상 동일하게 동작하는 것은 아니다.

이하의 예시는 학습용이다. 변경 구문은 실습 데이터베이스에서 실행하며, 실제 서비스 데이터에는 그대로 적용하지 않는다.

## 2 실습 표와 SELECT 해석

**핵심 한 줄:** 입력 표와 각 단계의 결과를 구분하면 복잡한 조회도 추적할 수 있다.

[강의 06:38 · SELECT와 별칭](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=398s)

DISTINCT는 출력 열 전체의 조합에 적용된다. LOAN에서 지점 10이 두 번 나오면 SELECT DISTINCT branch_id에서는 한 행이다. loan_id까지 함께 출력하면 두 대여가 서로 달라 두 행이 남는다.

### 강의 개념 정리

SELECT DISTINCT는 출력하는 열 조합이 같은 행을 하나로 만든다. FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY 순으로 결과를 해석하면 SELECT에서 만든 별칭을 WHERE에서 쓰기 어려운 이유를 알 수 있다.

직접 만든 도서 대여 서비스의 대여 기록 `LOAN`을 사용한다. FEE는 확정 대여료, LATE_FEE는 연체료다. NULL은 아직 값이 없다는 뜻이다.

| LOAN_ID | READER | BRANCH_ID | FEE | LATE_FEE |
|---|---|---|---|---|
| 11 | 다온 | 10 | 120 | NULL |
| 12 | 라온 | 10 | 180 | 0 |
| 13 | 마루 | 20 | 180 | 20 |
| 14 | 보람 | 20 | 300 | NULL |
| 15 | 이든 | NULL | NULL | NULL |

`BRANCH`에는 `(10, 북쪽)`, `(20, 남쪽)`, `(30, 동쪽)`이 있다. BRANCH_ID는 PK다. 이 실습 표에서만 각 대여 기록의 READER는 한 사람을 나타내는 표시 이름이다.

```sql
SELECT loan_id, fee * 2 AS doubled_fee
FROM loan
WHERE fee >= 180
ORDER BY fee DESC, loan_id;
```

조건을 통과하는 ID는 12·13·14다. 정렬 결과는 14·12·13이며 출력 계산값은 각각 600·360·360이다. FEE가 같은 경우 ID로 순서를 확정했다.

초급 조회의 논리적 흐름은 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY로 읽는다. 이는 의미를 이해하는 순서이며 실제 엔진의 실행 계획을 강제하지 않는다. DISTINCT·윈도우 함수·행 제한이 있는 경우에는 각 단계의 의미를 추가로 확인한다.

참고: [Oracle SELECT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html).

## 3 NULL과 조건의 세 가지 결과

**핵심 한 줄:** SQL 조건은 TRUE·FALSE 외에 UNKNOWN이 될 수 있다.

### 강사가 짚은 시험 포인트

**NULL 판정** · [강의 32:08](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=1928s)

강사가 문제로 만들기 좋은 차이로 짚는다. WHERE fee = NULL은 문법 오류가 아니라 비교 결과가 UNKNOWN이어서 행을 남기지 않는다. 미입력 값을 찾으려면 IS NULL을 쓴다.

[강의 23:01 · NULL 처리 함수](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=1381s)

COALESCE(NULL, 0, 7)의 결과는 0이다. 왼쪽부터 처음 만나는 NULL 아닌 값을 택하기 때문이다. NULLIF(0, 0)은 두 값이 같으므로 NULL이다. 0을 유효한 값으로 보존할지부터 정한 뒤 함수를 고른다.

### 강의 개념 정리

COUNT(*)는 행을 세고 COUNT(열)은 그 열이 NULL인 행을 제외한다. COALESCE는 왼쪽부터 처음 만나는 비NULL 값을 반환하고 NULLIF(a,b)는 두 값이 같으면 NULL을 반환한다.

`fee > 100`에서 FEE가 NULL인 15번 행은 UNKNOWN이다. WHERE는 TRUE인 행만 남기므로 15번은 결과에서 제외된다. `NOT (fee > 100)`으로 바꾸어도 UNKNOWN은 TRUE로 바뀌지 않는다.

| 의도 | 쓸 조건 |
|---|---|
| 대여료 미확정 | `fee IS NULL` |
| 대여료 확정 | `fee IS NOT NULL` |
| NULL을 계산상 0으로 대체 | `COALESCE(fee, 0)` |
| 두 값이 같으면 NULL | `NULLIF(fee, 180)` |

`fee = NULL`은 NULL을 찾는 조건이 아니다. NULL은 숫자 0과도 다르다. Oracle 19c는 길이 0의 문자열을 NULL로 취급하지만 SQL Server 등 다른 환경의 빈 문자열 동작까지 같다고 생각하면 안 된다.

참고: [Oracle NULL](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Nulls.html).

## 4 행마다 계산하는 표현식

**핵심 한 줄:** 단일행 함수는 각 입력 행에 적용할 값을 계산한다.

[강의 14:23 · 단일행 함수와 변환](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=863s)

Oracle 예시에서 TO_DATE('2026-11-03', 'YYYY-MM-DD')는 문자를 날짜로 바꾸고 TO_CHAR는 날짜나 숫자를 표시할 문자로 바꾼다. 문자열 SQL_01에서 SUBSTR('SQL_01', 1, 3)은 SQL이다. 함수가 돌려주는 값의 자료형까지 확인한다.

### 강의 개념 정리

단일행 함수는 행마다 문자·숫자·날짜 등을 계산한다. SUBSTR은 일부 문자열을 추출하고 ROUND는 반올림한다. 날짜 변환은 입력 형식을 명시하고 CASE의 조건은 위에서부터 확인한다.

```sql
SELECT loan_id,
       COALESCE(fee, 0) + COALESCE(late_fee, 0) AS total_fee,
       CASE WHEN fee >= 200 THEN '높음'
            WHEN fee IS NULL THEN '미정'
            ELSE '일반' END AS fee_band
FROM loan;
```

총액은 ID 11~15 순서로 120·180·200·300·0이다. 여기서는 표시용 합계를 0으로 대체했을 뿐 실제 미확정 금액을 확정한 것은 아니다. CASE는 위에서부터 조건을 확인한다.

문자 함수에는 UPPER·LOWER·TRIM·SUBSTR 등이 있고 숫자 함수에는 ROUND·TRUNC·ABS 등이 있다. 문자열 자르기는 Oracle의 SUBSTR와 SQL Server의 SUBSTRING처럼 이름·인수가 다를 수 있다.

날짜는 가능하면 날짜형으로 비교한다. Oracle 예: `created_at >= DATE '2026-01-01' AND created_at < DATE '2027-01-01'`. 세션 형식에 의존하는 암묵적 문자→날짜 변환은 피한다.

참고: [Oracle 함수 안내](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Functions.html).

## 5 행 필터를 정확히 쓰기

**핵심 한 줄:** 조건을 결합할 때 NULL과 괄호, 경계 포함 여부를 확인한다.

### 강사가 짚은 시험 포인트

**조건식의 우선순위** · [강의 32:28](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=1948s)

강사는 조건을 어떤 순서로 해석하는지 물을 수 있다고 설명한다. 논리 연산자는 NOT, AND, OR 순으로 계산한다. A OR B AND C는 A OR (B AND C)다.

[강의 25:49 · WHERE와 패턴](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=1549s)

문자 그대로의 밑줄을 찾을 때는 이스케이프 문자를 정한다. 예를 들어 `code LIKE 'SQL!_%' ESCAPE '!'`는 SQL_01과 일치하고 SQLA01과는 일치하지 않는다. 밑줄 앞의 !가 없으면 밑줄은 임의의 한 글자다.

### 강의 개념 정리

BETWEEN은 양쪽 경계를 포함한다. LIKE에서 %는 0개 이상의 문자, _는 정확히 한 문자다. AND가 OR보다 먼저 적용되므로 원하는 묶음은 괄호로 나타낸다.

`fee BETWEEN 120 AND 180`은 양 끝을 포함하여 ID 11·12·13을 남긴다. `fee IN (120, 300)`은 11·14를 남긴다. `reader LIKE '_온'`은 두 글자이며 끝이 ‘온’인 다온·라온에 해당한다. `%`는 0개 이상 문자, `_`는 한 문자 패턴이다.

```sql
SELECT loan_id
FROM loan
WHERE (branch_id = 10 OR branch_id = 20)
  AND fee >= 180
ORDER BY loan_id;
```

결과는 12·13·14다. AND가 OR보다 먼저 묶이므로 의도한 묶음에는 괄호를 쓴다.

`NOT IN (120, NULL)`은 NULL 때문에 예상과 다르게 작동한다. 180은 120과 다르지만 NULL과의 비교가 UNKNOWN이어서 결과가 TRUE가 되지 않는다. 하위 결과에 NULL이 있을 수 있는 제외 조회는 NOT EXISTS의 의미를 검토한다.

참고: [Oracle 조건](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Conditions.html).

## 6 집계와 그룹 필터

**핵심 한 줄:** WHERE는 집계 전 행을, HAVING은 집계한 그룹을 제한한다.

[강의 32:30 · GROUP BY와 HAVING](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=1950s)

조건이 어느 단위에 적용되는지 바꿔 읽어 보자. 지점 20의 대여료가 180과 300이면 WHERE fee >= 200 뒤의 합은 300이다. 두 행을 먼저 합한 뒤 HAVING SUM(fee) >= 400으로 거르면 합 480인 지점 20이 남는다.

### 강의 개념 정리

WHERE로 남긴 행을 GROUP BY로 묶고 HAVING으로 그룹을 고른다. ‘학생 3명 이상인 과목’은 개별 행의 조건이 아니라 과목별 집계 결과의 조건이다.

```sql
SELECT branch_id, COUNT(*) AS loans, SUM(fee) AS fee_sum
FROM loan
WHERE fee IS NOT NULL
GROUP BY branch_id
HAVING SUM(fee) >= 400
ORDER BY branch_id;
```

10번 지점 합계는 300, 20번 지점 합계는 480이다. 따라서 결과는 `(20, 2, 480)` 한 행이다.

전체 LOAN에서 COUNT(*)는 5, COUNT(fee)는 4, COUNT(DISTINCT fee)는 3이다. SUM(fee)는 780, AVG(fee)는 195다. AVG(COALESCE(fee,0))는 156으로 다른 지표다. 그룹 열에 NULL이 있는 행들은 한 그룹으로 묶일 수 있다.

WHERE로 빈 집합을 만든 뒤 GROUP BY 없이 집계하면 COUNT(*)는 0, SUM(fee)는 NULL이다. GROUP BY가 있는 조회에서는 입력이 없으면 그룹 행 자체가 없을 수 있다.

참고: [Oracle 집계 함수](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Aggregate-Functions.html).

## 7 정렬과 상위 N건

**핵심 한 줄:** 정렬 기준과 동점 처리 규칙을 먼저 정한다.

### 강사가 짚은 시험 포인트

**NULL 기본 정렬** · [강의 38:32](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=2312s)

강사가 Oracle과 SQL Server의 차이를 짚은 부분이다. 기본 오름차순에서 Oracle은 NULL을 마지막에, SQL Server는 처음에 놓는다. 내림차순이면 각각 반대다.

[강의 35:35 · 정렬과 동점](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=2135s)

대여료 내림차순에서 180이 두 행이라면 대여료만으로는 둘의 순서가 결정되지 않는다. 정확히 두 건을 고를 때와 공동 순위까지 고를 때의 답이 다르므로, 전자는 고유번호로 순서를 확정하고 후자는 동점 판단 기준을 유지한다.

### 강의 개념 정리

정렬은 첫 기준을 먼저 적용하고 동점에서 다음 기준을 쓴다. 상위 N건에서 정확히 N행을 뽑을지, 경계에서 같은 점수까지 포함할지 결정한다. Oracle의 ROWNUM은 같은 조회 단계의 ORDER BY보다 먼저 부여될 수 있다.

최종 ORDER BY가 없으면 출력 순서를 보장하지 않는다. 같은 대여료 사이의 순서가 중요하면 고유 ID 같은 추가 정렬 키를 둔다.

Oracle 19c 예:

```sql
SELECT loan_id, fee
FROM loan
WHERE fee IS NOT NULL
ORDER BY fee DESC, loan_id
FETCH FIRST 2 ROWS ONLY;
```

결과는 `(14,300)`, `(12,180)`이다. 상위 두 **행**과 상위 두 **금액 등급**은 다르다. 금액 기준 동점을 모두 원하면 동점 포함 문법이나 DENSE_RANK를 검토한다.

SQL Server는 `SELECT TOP (2) ... ORDER BY ...`를 사용할 수 있다. Oracle의 ROWNUM으로 상위 정렬 결과를 고르려면 내부 조회에서 정렬하고 바깥 조회에서 ROWNUM을 제한하는 패턴이 필요하다.

참고: [Microsoft TOP](https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql?view=sql-server-ver17), [Oracle ROWNUM](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROWNUM-Pseudocolumn.html).

## 8 조인에서 행 수 세기

**핵심 한 줄:** 조인은 행의 쌍을 만들기 때문에 한쪽 값이 반복되면 결과도 늘어난다.

[강의 41:10 · 표준 조인](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=2470s)

양쪽 열 이름이 branch_id라면 JOIN branch USING (branch_id)로 연결할 수 있다. ON은 열 이름이 다르거나 추가 조건이 있을 때도 쓴다. NATURAL JOIN은 이름이 같은 열을 모두 조건에 넣으므로 나중에 동명 열이 추가되면 결과가 달라질 수 있다.

### 강의 개념 정리

내부 조인은 일치하는 쌍만 남기고 왼쪽 외부 조인은 짝이 없는 왼쪽 행도 남긴다. 외부 조인 뒤 WHERE에서 오른쪽 열을 제한하면 NULL로 보존한 행까지 제외할 수 있다.

```sql
SELECT b.branch_id, b.branch_name, l.loan_id
FROM branch b
LEFT JOIN loan l ON l.branch_id = b.branch_id
ORDER BY b.branch_id, l.loan_id;
```

10번 지점에 2행, 20번 지점에 2행, 대여가 없는 30번 지점에 NULL 확장 1행으로 총 5행이다. 지점이 NULL인 대여 15번은 지점 기준 LEFT JOIN 결과에 포함되지 않는다.

INNER JOIN은 조건에 맞는 쌍만, LEFT JOIN은 왼쪽의 미매칭 행도, FULL OUTER JOIN은 양쪽의 미매칭 행도 보존한다. CROSS JOIN은 가능한 모든 쌍이다. 이 예시에서 BRANCH와 LOAN의 CROSS JOIN은 3×5=15행이다.

LEFT JOIN 후 `WHERE l.fee >= 200`을 쓰면 NULL 확장 행도 제외된다. ‘지점을 모두 유지하면서 조건에 맞는 대여만 붙이기’라면 그 조건을 ON에 둘 수 있다. ON과 WHERE는 언제나 교환 가능한 것이 아니다.

SELF JOIN은 같은 테이블에 서로 다른 별칭을 붙여 연결하는 방식이다. 조인 전후 행 수를 예상하고 조건 누락을 점검한다.

참고: [Oracle 조인](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html).

## 9 서브쿼리로 질문 나누기

**핵심 한 줄:** 하위 조회의 결과가 값 하나인지, 목록인지, 존재 여부인지 구분한다.

### 강사가 짚은 시험 포인트

**뷰의 장점** · [강의 50:51](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=3051s)

강사는 뷰의 장점을 출제 포인트로 언급한다. 반복되는 조회를 이름으로 재사용하고, 필요한 열만 공개할 수 있다. 행을 따로 저장하거나 실행 속도가 항상 빨라진다는 뜻은 아니다.

[강의 45:30 · 서브쿼리와 뷰](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=2730s)

FROM 안의 SELECT를 인라인 뷰(Inline view)라고 한다. 지점별 합계를 먼저 구해 이름을 붙이면 바깥 SELECT가 그 합계를 일반 열처럼 걸러낼 수 있다. 스칼라 서브쿼리는 한 열과 최대 한 행을 기대한다. Oracle에서는 0행이면 NULL이고 여러 행이면 오류다.

### 강의 개념 정리

스칼라 서브쿼리는 한 열·최대 한 행의 값, 인라인 뷰는 FROM의 임시 결과다. EXISTS는 안쪽 행의 존재를 묻는다. NOT IN 목록에 NULL이 있으면 일치하지 않는 값도 UNKNOWN이 될 수 있다.

```sql
SELECT loan_id, fee
FROM loan
WHERE fee > (SELECT AVG(fee) FROM loan)
ORDER BY loan_id;
```

전체 평균 195보다 큰 행은 14번이다. 스칼라 서브쿼리는 한 행·한 열의 값을 기대하며 0행이면 NULL, 두 행 이상이면 오류가 발생할 수 있다.

```sql
SELECT b.branch_id
FROM branch b
WHERE NOT EXISTS (
  SELECT 1 FROM loan l WHERE l.branch_id = b.branch_id
)
ORDER BY b.branch_id;
```

대여 기록이 없는 30번 지점만 남는다. EXISTS는 선택 목록의 값보다 조건에 맞는 행의 존재 여부를 본다. 외부 행의 값을 참조하는 형태를 상관 서브쿼리라고 한다. 문장 형태만으로 실제 실행 횟수나 성능을 단정하지 않는다.

참고: [Oracle 서브쿼리](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Using-Subqueries.html).

## 10 결과를 합치거나 겹치기

**핵심 한 줄:** 집합 연산은 두 결과를 행 방향으로 결합하는 연산이며 열 개수와 자료형 호환성을 확인한다.

[강의 50:45 · 집합 연산](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=3045s)

왼쪽 결과가 A, A, B이고 오른쪽이 A, C라면 UNION ALL은 다섯 행, UNION은 A·B·C 세 행이다. INTERSECT는 A를, 왼쪽 MINUS 오른쪽은 B를 남긴다. 최종 표시 순서가 필요하면 전체 결과에 ORDER BY를 적용한다.

### 강의 개념 정리

UNION ALL은 두 결과를 행 방향으로 이어 붙이고 UNION은 중복도 제거한다. INTERSECT는 공통 행, MINUS 또는 EXCEPT는 첫 결과에만 있는 행이다. 대응하는 열의 수와 자료형이 호환돼야 한다.

두 조회의 결과가 A=`[10,10,20]`, B=`[20,30]`이라고 하자.

| 연산 | 결과의 값 또는 다중집합 |
|---|---|
| UNION | 10,20,30 |
| UNION ALL | 10,10,20,20,30 |
| INTERSECT | 20 |
| A MINUS B (Oracle 19c) | 10 |

위 표는 값과 중복 여부를 설명한 것이며 출력 순서를 보장하지 않는다. SQL Server에서는 차집합에 EXCEPT를 쓴다. 최종 순서는 결합된 결과의 ORDER BY로 정한다.

조인은 컬럼을 붙여 행 쌍을 만드는 연산이고 UNION 계열은 호환되는 결과 행들을 모으는 연산이다. 두 개념을 혼동하지 않는다. 혼합 연산은 DBMS의 우선순위 차이를 피하도록 의도한 묶음을 명시한다.

참고: [Oracle 집합 연산](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html).

## 11 소계·총계의 구분

**핵심 한 줄:** 집계 결과의 NULL이 원래 값인지 소계를 나타내는지 구별한다.

[강의 52:10 · 소계와 총계](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=3130s)

ROLLUP(지점, 월)은 (지점, 월), (지점), () 수준을 만든다. CUBE는 여기에 지점 전체를 가로지르는 (월) 수준까지 더한다. GROUPING(월)이 1이면 월을 집계에서 제외한 소계 표시이고, 원본의 미입력 월과 구별할 수 있다.

### 강의 개념 정리

ROLLUP(a,b)는 (a,b), (a), 전체 순으로 집계한다. CUBE(a,b)는 (b)도 포함하고 GROUPING SETS는 필요한 조합을 직접 지정한다. GROUPING으로 원래 NULL과 집계 때문에 생긴 NULL을 구분한다.

`GROUP BY ROLLUP(branch_id)`는 지점별 집계와 전체 총계를 만든다. 실습에서는 실제 NULL 지점 그룹과 전체 총계가 모두 나타날 수 있다.

```sql
SELECT branch_id, GROUPING(branch_id) AS is_total,
       SUM(fee) AS fee_sum
FROM loan
GROUP BY ROLLUP(branch_id);
```

총계는 780이며 해당 행의 GROUPING(branch_id)는 1이다. 원본 BRANCH_ID가 NULL인 그룹의 GROUPING 값은 0이다. 이 그룹의 FEE는 모두 NULL이므로 SUM도 NULL이다.

ROLLUP(a,b)는 `(a,b)`, `(a)`, `()` 집계 수준을 만든다. CUBE(a,b)는 여기에 `(b)`도 포함한다. GROUPING SETS는 필요한 집계 수준을 직접 나열한다.

참고: [Oracle GROUPING](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GROUPING.html).

## 12 순위와 누적합

**핵심 한 줄:** 윈도우 함수는 행을 유지하면서 관련 행들을 함께 계산한다.

[강의 55:10 · 윈도우 함수](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=3310s)

점수 10·20·20을 오름차순으로 정렬하면 20인 각 행의 RANK는 2다. PERCENT_RANK는 (순위−1)/(행 수−1)이므로 0.5이고 CUME_DIST는 현재 값 이하인 행 수/전체 행 수이므로 1이다. NTILE은 정렬된 행을 지정한 수의 묶음으로 나누므로 동점도 갈라질 수 있다.

### 강의 개념 정리

윈도우 함수는 행을 유지한다. PARTITION BY는 계산할 묶음, ORDER BY는 계산 순서, 프레임은 현재 행에 포함할 범위다. ROWS는 행 수를 기준으로 하고 RANGE는 정렬값을 기준으로 하므로 동점에서 누적합이 달라질 수 있다.

FEE가 NULL인 행을 제외하고 내림차순으로 정렬하면 금액은 300·180·180·120이다.

| 함수 | 이 순서에서의 값 |
|---|---|
| RANK | 1,2,2,4 |
| DENSE_RANK | 1,2,2,3 |
| ROW_NUMBER | 1,2,3,4 |

ROW_NUMBER의 동점 행에 부여되는 번호까지 확정하려면 `ORDER BY fee DESC, loan_id`처럼 추가 기준이 필요하다. RANK에서도 ID를 추가하면 동점의 정의가 달라진다는 점에 주의한다.

```sql
SELECT loan_id, fee,
       SUM(fee) OVER (
         ORDER BY loan_id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_fee
FROM loan
WHERE fee IS NOT NULL
ORDER BY loan_id;
```

누적합은 120·300·480·780이다. PARTITION BY는 계산 집단을 나눈다. LAG·LEAD는 앞뒤 행의 값을, FIRST_VALUE·LAST_VALUE는 지정한 프레임의 처음·마지막 값을 읽는다. 특히 LAST_VALUE가 항상 파티션 전체의 마지막 값은 아니다.

ROWS는 행 위치 기준이며 RANGE는 정렬값의 동점 범위 등을 함께 고려할 수 있다. 기본 프레임을 추측하지 말고 필요한 범위를 명시한다.

참고: [Oracle 분석 함수](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html).

## 13 계층 관계 읽기

**핵심 한 줄:** 부모·자식 방향과 시작점을 먼저 정한다.

[강의 69:10 · 계층형 질의](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4150s)

직원 표의 manager_id가 같은 표의 employee_id를 참조한다고 하자. 자기 조인 한 번은 직원과 직속 상사를 짝짓는다. 최상위 상사까지 깊이를 모르면 계층형 질의나 재귀 질의로 부모 연결을 반복해서 따라간다.

### 강의 개념 정리

셀프 조인은 같은 표를 별칭으로 두 번 사용해 자식과 부모를 짝짓는다. Oracle 계층 질의는 START WITH로 출발 행을, CONNECT BY로 다음 행을 정한다. PRIOR가 어느 열에 붙는지 보고 탐색 방향을 읽는다.

학습용 분류표 `CATEGORY(category_id, parent_id)`에서 최상위 행의 PARENT_ID는 NULL이라고 하자. Oracle 계층 조회 예시는 다음과 같다.

```sql
SELECT category_id, parent_id, LEVEL
FROM category
START WITH parent_id IS NULL
CONNECT BY PRIOR category_id = parent_id;
```

PRIOR가 붙은 CATEGORY_ID는 부모 행의 값이다. 자식의 PARENT_ID와 연결하므로 아래 방향으로 탐색한다. LEVEL은 시작 행에서 1이다.

순환 관계가 있으면 탐색이 실패하거나 별도 처리가 필요하다. Oracle의 NOCYCLE·CONNECT_BY_ISCYCLE 같은 기능과 DBMS별 재귀 CTE 문법을 확인한다. 계층에서의 탐색 순서와 최종 표시 정렬은 별도로 생각한다.

참고: [Oracle 계층 조회](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Hierarchical-Queries.html).

## 14 행·열 변환과 문자열 패턴

**핵심 한 줄:** 피벗은 집계 구조 변환이고 정규식은 문자 패턴 처리다.

### 강사가 짚은 시험 포인트

**정규표현식 공부 범위** · [강의 73:17](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4397s)

강사는 대표 패턴을 먼저 익히라고 한다. ^는 시작, $는 끝, [0-9]는 숫자 한 자리다. ^[0-9]+$는 처음부터 끝까지 숫자가 하나 이상인 문자열에 맞는다.

[강의 71:20 · PIVOT과 UNPIVOT](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4280s)

한 학생의 1차 점수 70·80을 MAX로 피벗하면 80만 남는다. 이를 다시 언피벗해도 70은 복원되지 않는다. 방향을 뒤집기 전에 집계 단계에서 정보가 합쳐졌는지 확인한다.

### 강의 개념 정리

PIVOT은 분류값별 집계를 열로 펼치고 UNPIVOT은 여러 열을 행으로 모은다. 정규식에서 ^와 $는 시작과 끝, [0-9]는 숫자 한 자리다. 패턴 검색과 표 모양 변환을 구별한다.

두 지점의 대여료 합계를 한 행으로 만들려면 조건부 집계를 쓸 수 있다.

```sql
SELECT SUM(CASE WHEN branch_id = 10 THEN fee END) AS north_fee,
       SUM(CASE WHEN branch_id = 20 THEN fee END) AS south_fee
FROM loan;
```

결과는 북쪽 300, 남쪽 480이다. PIVOT은 특정 열의 값을 결과 열로 펼치는 구문이며 남는 열이 그룹 기준이 될 수 있다. UNPIVOT은 열들을 행으로 돌리는 구문으로, 집계 과정에서 잃은 개별 원본 행까지 복원하는 역연산은 아니다. NULL 포함 여부도 문법별로 확인한다.

Oracle의 `REGEXP_LIKE(code, '^[A-Z]{2}[0-9]{3}$')`는 대문자 두 개와 숫자 세 개의 형식을 검사하는 예다. 정규식 지원 범위·대소문자·문자 정렬 규칙은 환경마다 확인한다.

참고: [Oracle PIVOT·UNPIVOT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html), [Oracle 정규식](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/REGEXP_LIKE.html).

## 15 데이터 변경과 영향 범위

**핵심 한 줄:** 값을 바꾸기 전에 같은 조건의 SELECT로 대상 행을 확인한다.

[강의 73:43 · DML](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4423s)

INSERT에서 열 목록을 쓰면 값이 어느 열에 대응하는지 드러난다. 생략한 열에는 기본값이 있으면 기본값이 적용되고, 기본값이 없으면 일반적으로 NULL이 들어간다. NOT NULL을 위반하면 행이 저장되지 않는다.

### 강의 개념 정리

INSERT는 새 행, UPDATE는 기존 행의 값, DELETE는 기존 행 자체를 다룬다. MERGE는 대상과 원본의 일치 여부에 따라 수정이나 삽입을 수행한다. 조건을 생략하면 변경 범위가 표 전체가 될 수 있다.

```sql
UPDATE loan
SET late_fee = 0
WHERE loan_id = 11;
```

11번의 연체료만 변경한다. WHERE가 없으면 모든 행이 변경 대상이 된다. DELETE도 동일하게 대상 조건을 점검한다. INSERT는 컬럼 목록을 명시하면 의도를 확인하기 쉽다.

MERGE는 소스와 대상의 매칭 조건에 따라 갱신·삽입 등을 결합한다. 지원 동작과 문법은 DBMS에 따라 다르다. 소스가 같은 대상 행에 여러 번 매칭되지 않는지도 검토한다.

제약조건 오류가 나면 어느 문장과 어느 트랜잭션 범위가 취소되는지 확인한다. ‘오류가 났으니 앞의 모든 변경이 취소됐다’고 가정하지 않는다.

참고: [Oracle UPDATE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/UPDATE.html), [Oracle MERGE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MERGE.html).

## 16 확정·취소와 격리 수준

**핵심 한 줄:** 트랜잭션 경계를 알고 동시 실행에서 보이는 값을 구분한다.

[강의 75:57 · TCL과 저장점](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4557s)

대여료를 100에서 120으로 바꾸고 저장점 S를 만든 뒤 150으로 바꿨다고 하자. ROLLBACK TO S 직후 값은 120이고 아직 확정 전이다. 그 뒤 COMMIT하면 120이 확정된다.

### 강의 개념 정리

COMMIT은 변경을 확정하고 ROLLBACK은 미확정 변경을 되돌린다. SAVEPOINT 뒤의 변경만 취소할 수도 있다. 격리 수준은 다른 거래의 미확정 값을 볼 수 있는지, 같은 조회 결과가 바뀔 수 있는지로 비교한다.

```sql
SAVEPOINT before_change;
UPDATE loan SET late_fee = 0 WHERE loan_id = 11;
ROLLBACK TO before_change;
COMMIT;
```

위 구문은 Oracle 예다. 저장점 이후 변경만 취소한 뒤 남은 트랜잭션을 확정한다. SQL Server의 저장점 문법은 SAVE TRANSACTION 등으로 다르다.

Dirty read는 다른 트랜잭션의 미확정 값을 읽는 현상, non-repeatable read는 같은 행을 재조회했을 때 값이 바뀌는 현상, phantom read는 같은 조건의 결과 행 집합이 바뀌는 현상이다.

격리 수준 이름에는 READ UNCOMMITTED·READ COMMITTED·REPEATABLE READ·SERIALIZABLE이 있다. 구현·기본값·지원 여부는 DBMS별로 다르다. Oracle 19c는 READ COMMITTED와 SERIALIZABLE 등을 제공하며 네 이름을 모두 동일한 방식으로 선택하는 것은 아니다.

Oracle은 문법적으로 유효한 DDL 실행 전에 암묵적으로 COMMIT하며 성공한 DDL 후에도 COMMIT한다. DDL까지 ROLLBACK 가능하다고 일괄적으로 가정하지 않는다.

참고: [Oracle COMMIT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html), [동시성과 일관성](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html).

## 17 테이블 정의와 제약조건

**핵심 한 줄:** 자료형은 저장할 값의 종류, 제약은 허용할 상태를 정한다.

[강의 79:10 · DDL과 제약조건](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4750s)

행 일부만 지우려면 DELETE와 조건을 사용한다. TRUNCATE는 표의 전체 데이터를 비우고 구조를 남긴다. DROP TABLE은 표 정의까지 제거한다. 취소 가능 여부는 DBMS와 명령마다 다르므로 시험에서 지정한 환경을 확인한다.

### 강의 개념 정리

CREATE·ALTER·DROP은 객체의 구조를 정의·변경·제거한다. TRUNCATE는 테이블 정의를 남기고 전체 데이터를 비운다. DELETE와의 롤백 차이는 DBMS에 따라 달라진다.

Oracle 예:

```sql
CREATE TABLE study_result (
  result_id NUMBER PRIMARY KEY,
  learner_name VARCHAR2(40) NOT NULL,
  score NUMBER CHECK (score BETWEEN 0 AND 100)
);
```

CHECK만으로 SCORE의 NULL을 금지하지 않는다. 값이 반드시 있어야 한다면 NOT NULL도 필요하다. DEFAULT는 값 생략 시 사용할 기본값을 정하며 모든 명시적 NULL을 자동 대체한다고 가정하지 않는다.

ALTER는 객체 구조 변경, DROP은 객체 제거, TRUNCATE는 테이블의 행을 일괄 제거하는 작업이다. DELETE와 TRUNCATE는 트랜잭션 처리·트리거·참조 제약 등 동작이 다를 수 있다.

뷰는 조회 정의를 제공하고 인덱스는 접근을 도울 수 있다. 인덱스가 많을수록 무조건 좋은 것은 아니며 저장 공간과 변경 비용도 든다.

참고: [Oracle CREATE TABLE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html).

## 18 권한 부여와 회수

**핵심 한 줄:** 어떤 권한을 누구에게 전달했는지 따라가면 회수 뒤에도 사용할 수 있는 권한을 판단할 수 있다.

[강의 83:15 · DCL과 권한 회수](https://www.youtube.com/watch?v=Rv4Q4ZrPS94&t=4995s)

Oracle에서 소유자가 A에게 객체의 SELECT 권한을 WITH GRANT OPTION으로 주고 A가 B에게 전달했다고 하자. 다른 부여 경로가 없다면 소유자가 A의 권한을 회수할 때 B도 그 경로의 권한을 잃는다. 시스템 권한의 WITH ADMIN OPTION은 A의 권한을 회수해도 이미 B에게 부여한 권한이 자동으로 회수되지 않는다.

### 강의 개념 정리

객체 권한을 WITH GRANT OPTION으로 받으면 다른 사용자에게 그 권한을 줄 수 있다. Oracle의 WITH ADMIN OPTION은 시스템 권한이나 역할을 다시 부여할 때 쓴다. 회수 문제는 누가 누구에게 어떤 경로로 권한을 주었는지 그려 본다.

```sql
GRANT SELECT ON study_result TO study_reader;
REVOKE SELECT ON study_result FROM study_reader;
```

Oracle 객체 권한의 예다. 사용자가 존재하며 명령 실행자가 권한을 부여할 수 있어야 한다. 역할을 통해 권한을 묶을 수 있지만 객체 소유권·직접 부여·역할의 동작은 구분한다.

참고 자료 · [Oracle GRANT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GRANT.html) · [Oracle REVOKE](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/REVOKE.html)

## 확인문제

1. LOAN에서 `fee >= 180`을 만족하는 LOAN_ID를 오름차순으로 적어라.
2. 전체 LOAN의 COUNT(*)와 COUNT(fee)는 각각 얼마인가?
3. SUM(fee)와 AVG(fee)는 얼마인가?
4. AVG(COALESCE(fee,0))는 얼마이며 AVG(fee)와 왜 다른가?
5. `fee = NULL`로 15번 행을 찾을 수 있는가?
6. `fee BETWEEN 120 AND 180`을 통과하는 ID는?
7. `fee NOT IN (120,NULL)`을 통과하는 행은 몇 개인가?
8. 지점별 SUM(fee)가 400 이상인 지점은?
9. BRANCH를 기준으로 LOAN을 LEFT JOIN하면 몇 행인가?
10. BRANCH와 LOAN의 CROSS JOIN은 몇 행인가?
11. 대여가 없는 지점을 NOT EXISTS로 조회하면 어느 지점인가?
12. 전체 평균보다 큰 FEE를 갖는 ID는?
13. `[10,10,20]`과 `[20,30]`을 UNION ALL한 결과에는 20이 몇 번 있는가?
14. 원본 NULL 지점 그룹과 ROLLUP 총계를 어떤 함수로 구별하는가?
15. 300·180·180·120의 RANK는?
16. 같은 데이터의 DENSE_RANK는?
17. ID 순으로 FEE 누적합을 계산하되 NULL 금액 행은 제외하면 값은?
18. ROW_NUMBER에서 FEE가 같은 행의 번호를 확정하려면?
19. `CONNECT BY PRIOR category_id = parent_id`에서 PRIOR 쪽 값은 누구의 값인가?
20. 지점 10과 20의 대여료를 조건부 집계하면 각각 얼마인가?
21. CHECK(score BETWEEN 0 AND 100)만 있으면 NULL이 금지되는가?
22. Oracle에서 DDL 실행까지 항상 ROLLBACK할 수 있는가?

## 확인문제 해설

1. 12·13·14다. 15의 비교 결과는 UNKNOWN이다.
2. 5와 4다. COUNT(fee)는 NULL을 세지 않는다.
3. 780과 195다. 평균 분모는 FEE가 있는 4행이다.
4. 156이다. NULL을 0으로 바꾸면서 분모가 5행이 된다.
5. 아니다. `fee IS NULL`을 사용한다.
6. 11·12·13이다. 양쪽 경계가 포함된다.
7. 0개다. NULL이 포함된 비교 때문에 조건이 TRUE가 되지 않는다.
8. 20번 지점이다. 합계는 480이다.
9. 5행이다. 10·20 지점 각각 2행, 30 지점의 NULL 확장 1행이다.
10. 15행이다. 3개 지점과 5개 대여의 모든 쌍이다.
11. 30번 지점이다.
12. 14번이다. 300만 전체 평균 195보다 크다.
13. 2번이다. UNION ALL은 중복을 유지한다.
14. GROUPING(branch_id)를 쓴다. 원본 그룹은 0, 총계는 1이다.
15. 1·2·2·4다.
16. 1·2·2·3이다.
17. 120·300·480·780이다.
18. ORDER BY에 LOAN_ID 등 유일한 추가 정렬 기준을 넣는다.
19. 부모 행의 CATEGORY_ID다. 자식 PARENT_ID와 비교한다.
20. 300과 480이다.
21. 아니다. 값이 필수이면 NOT NULL도 필요하다.
22. 아니다. Oracle의 암묵적 COMMIT 경계를 확인해야 한다.

## 참고자료와 작성 범위

DBMS 세부 동작은 각 절에 연결한 Oracle 19c·Microsoft 공식 문서로 확인한다. 이 자료의 대여 표·설명·문제·해설은 새로 작성했다. 공식 문서의 원문·그림을 재배포하지 않으며 해당 문서의 권리는 각 권리자에게 있다.

개인 학습 과정에서 참고한 강의: [아답터 SQLD 2과목](https://www.youtube.com/watch?v=Rv4Q4ZrPS94). 제작자의 승인·제휴·감수를 뜻하지 않는다. 영상·자막·유료 노트·첨부 PDF는 공개 자료에 포함하지 않는다.
