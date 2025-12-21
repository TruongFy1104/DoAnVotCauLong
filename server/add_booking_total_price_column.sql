-- Thêm cột TotalPrice vào bảng booking
ALTER TABLE booking 
ADD COLUMN TotalPrice DECIMAL(10, 2) DEFAULT 70000;

-- Cập nhật giá trị mặc định cho các booking hiện có
UPDATE booking 
SET TotalPrice = 70000 
WHERE TotalPrice IS NULL;
