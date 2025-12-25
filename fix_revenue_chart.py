import re  
file_path = 'backend/payments/views.py'  
with open(file_path, 'r', encoding='utf-8') as f:  
    content = f.read()  
content = content.replace('\"amount\": float(d[\"amount\"] or 0), \"type\": \"Ngay\"', '\"value\": float(d[\"amount\"] or 0), \"metric\": \"Doanh thu ngay\"')  
content = content.replace('\"amount\": float(m[\"amount\"] or 0), \"type\": \"Thang\"', '\"value\": float(m[\"amount\"] or 0), \"metric\": \"Doanh thu thang\"')  
with open(file_path, 'w', encoding='utf-8') as f:  
    f.write(content)  
