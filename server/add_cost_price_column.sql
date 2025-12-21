-- Thêm cột CostPrice vào bảng Product để lưu giá nhập từ nhà cung cấp
ALTER TABLE Product 
ADD COLUMN CostPrice FLOAT DEFAULT 0 COMMENT 'Giá nhập từ nhà cung cấp';

-- Cập nhật giá trị mặc định cho các sản phẩm hiện có
UPDATE Product 
SET CostPrice = 0 
WHERE CostPrice IS NULL;
