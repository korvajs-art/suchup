-- Seed data. Default admin: admin / changeme
DELETE FROM sessions;
DELETE FROM contacts;
DELETE FROM admins;
INSERT INTO admins (username, password_hash, salt) VALUES ('admin', '1d975f1e741a1d31a5bb4fb655cdb1158f226e83f0bdb636727f2a90a5b8ccc9', '0123456789abcdef0123456789abcdef');

INSERT INTO contacts (name, region, dept, position, phone, email, appoint_date, birth_date, military_branch, military_rank, commission, commission_type, class_no, address, remark) VALUES
('김민수', '서울', '본부', '회장', '010-1234-5678', 'minsu.kim@example.com', '', '', '육군', '대령', '', '', '', '서울특별시 중구 세종대로 110', ''),
('이서연', '서울', '사무국', '사무국장', '010-2345-6789', 'seoyeon.lee@example.com', '', '', '', '', '', '', '', '서울특별시 종로구 종로 1', ''),
('박준호', '경기', '경기도회', '회장', '010-3456-7890', 'junho.park@example.com', '', '', '육군', '중령', '', '', '', '경기도 수원시 영통구 광교로 209', ''),
('최유진', '경기', '경기도회', '부회장', '010-4567-8901', 'yujin.choi@example.com', '', '', '', '', '', '', '', '', ''),
('정인규', '경남', '경남도회', '회장', '010-4566-3080', 'ingyu.jung@example.com', '2020-01-01', '1960-01-01', '육군', '대령', '', '', '', '경상남도 창원시 의창구 중앙대로 151', ''),
('한동욱', '경남', '경남도회', '육군부회장', '010-3215-9949', 'dongwook.han@example.com', '', '', '육군', '', '', '', '', '', ''),
('오하늘', '부산', '부산시회', '회장', '010-5678-9012', 'haneul.oh@example.com', '', '', '', '', '', '', '', '부산광역시 연제구 중앙대로 1001', ''),
('윤재석', '부산', '부산시회', '총무', '010-6789-0123', 'jaeseok.yoon@example.com', '', '', '', '', '', '', '', '', ''),
('강미라', '대전', '사무국', '과장', '010-7890-1234', 'mira.kang@example.com', '', '', '', '', '', '', '', '대전광역시 서구 둔산로 100', ''),
('조현우', '대구', '대구시회', '부회장', '010-8901-2345', 'hyunwoo.cho@example.com', '', '', '', '', '', '', '', '', ''),
('신예린', '인천', '인천시회', '총무', '010-9012-3456', 'yerin.shin@example.com', '', '', '', '', '', '', '', '인천광역시 남동구 예술로 178', ''),
('임성호', '광주', '광주시회', '회장', '010-0123-4567', 'seongho.lim@example.com', '', '', '', '', '', '', '', '', '');
