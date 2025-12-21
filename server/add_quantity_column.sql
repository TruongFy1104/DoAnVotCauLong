-- Migration: Thêm cột Quantity vào bảng Product
-- Ngày tạo: 2025-12-16

ALTER TABLE Product 
ADD COLUMN Quantity INT DEFAULT 0;

-- Cập nhật comment cho cột
ALTER TABLE Product 
MODIFY COLUMN Quantity INT DEFAULT 0 COMMENT 'Số lượng sản phẩm tồn kho';
