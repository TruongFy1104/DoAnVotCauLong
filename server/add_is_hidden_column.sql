-- Thêm cột IsHidden vào bảng Product để ẩn/hiện sản phẩm
ALTER TABLE `Product` 
ADD COLUMN `IsHidden` TINYINT(1) DEFAULT 0 COMMENT '0: Hiện, 1: Ẩn';

-- Cập nhật các sản phẩm hiện tại thành hiển thị (0)
UPDATE `Product` SET `IsHidden` = 0 WHERE `IsHidden` IS NULL;
