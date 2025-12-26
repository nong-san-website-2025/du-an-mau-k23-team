-- Kiểm tra đơn hàng theo trạng thái
SELECT status, COUNT(*) as count FROM orders_order GROUP BY status ORDER BY count DESC;

-- Kiểm tra đơn hàng delivered/completed có province_id
SELECT id, status, province_id, district_id, ward_code 
FROM orders_order 
WHERE status IN ('delivered', 'completed')
LIMIT 10;
