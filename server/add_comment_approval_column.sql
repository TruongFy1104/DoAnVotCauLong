-- Thêm cột IsApproved vào bảng comments
ALTER TABLE comments 
ADD COLUMN IsApproved BOOLEAN DEFAULT FALSE;

-- Cập nhật các bình luận hiện có để IsApproved = TRUE (cho phép hiển thị các bình luận cũ)
UPDATE comments SET IsApproved = TRUE WHERE IsApproved IS NULL;
