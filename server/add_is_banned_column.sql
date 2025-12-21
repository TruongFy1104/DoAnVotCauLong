-- Thêm cột IsBanned vào bảng account
-- Giá trị mặc định là 0 (không bị khóa), 1 là bị khóa
ALTER TABLE account 
ADD COLUMN IsBanned TINYINT(1) DEFAULT 0 COMMENT '0: Không bị khóa, 1: Bị khóa';
