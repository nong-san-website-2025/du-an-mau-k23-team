import pandas as pd
from datetime import datetime
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import FlashSale, FlashSaleProduct
from products.models import Product


class FlashSaleExcelImportService:
    """Service để xử lý import Flash Sale từ file Excel"""
    
    REQUIRED_COLUMNS = ['product_id', 'flash_price', 'stock', 'start_time', 'end_time']
    OPTIONAL_COLUMNS = ['product_name']
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.created_count = 0
        
    def validate_excel_file(self, file):
        """Kiểm tra file Excel có hợp lệ không"""
        try:
            if not file.name.endswith(('.xlsx', '.xls')):
                self.errors.append("File phải là định dạng Excel (.xlsx hoặc .xls)")
                return False
            return True
        except Exception as e:
            self.errors.append(f"Lỗi khi kiểm tra file: {str(e)}")
            return False
    
    def read_excel(self, file):
        """Đọc dữ liệu từ file Excel"""
        try:
            df = pd.read_excel(file)
            
            # Chuẩn hóa tên cột (chuyển thành chữ thường)
            df.columns = df.columns.str.lower().str.strip()
            
            return df
        except Exception as e:
            self.errors.append(f"Lỗi khi đọc file Excel: {str(e)}")
            return None
    
    def validate_columns(self, df):
        """Kiểm tra các cột bắt buộc có tồn tại không"""
        missing_columns = []
        for col in self.REQUIRED_COLUMNS:
            if col not in df.columns:
                missing_columns.append(col)
        
        if missing_columns:
            self.errors.append(f"Thiếu các cột bắt buộc: {', '.join(missing_columns)}")
            return False
        
        return True
    
    def validate_and_parse_row(self, row, row_idx):
        """Xác thực và phân tích từng dòng dữ liệu"""
        errors = []
        
        try:
            # Lấy product_id
            product_id = int(row.get('product_id', ''))
        except (ValueError, TypeError):
            errors.append(f"Dòng {row_idx + 1}: product_id phải là số nguyên")
            self.errors.extend(errors)
            return None
        
        # Kiểm tra sản phẩm có tồn tại không
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            errors.append(f"Dòng {row_idx + 1}: Sản phẩm ID {product_id} không tồn tại")
            self.errors.extend(errors)
            return None
        
        # Kiểm tra flash_price
        try:
            flash_price = float(row.get('flash_price', ''))
            if flash_price <= 0:
                errors.append(f"Dòng {row_idx + 1}: Giá flash phải > 0")
                self.errors.extend(errors)
                return None
            if flash_price >= product.original_price:
                errors.append(f"Dòng {row_idx + 1}: Giá flash ({flash_price}) phải thấp hơn giá gốc ({product.original_price})")
                self.errors.extend(errors)
                return None
        except (ValueError, TypeError):
            errors.append(f"Dòng {row_idx + 1}: flash_price phải là số")
            self.errors.extend(errors)
            return None
        
        # Kiểm tra stock
        try:
            stock = int(row.get('stock', ''))
            if stock < 1:
                errors.append(f"Dòng {row_idx + 1}: Số lượng phải >= 1")
                self.errors.extend(errors)
                return None
            if stock > product.stock:
                errors.append(f"Dòng {row_idx + 1}: Số lượng sale ({stock}) vượt quá tồn kho hiện tại ({product.stock})")
                self.errors.extend(errors)
                return None
        except (ValueError, TypeError):
            errors.append(f"Dòng {row_idx + 1}: stock phải là số nguyên")
            self.errors.extend(errors)
            return None
        
        # Kiểm tra thời gian
        try:
            start_time = pd.to_datetime(row.get('start_time', ''))
            end_time = pd.to_datetime(row.get('end_time', ''))
            
            # Chuyển thành timezone-aware datetime
            if start_time.tzinfo is None:
                start_time = timezone.make_aware(start_time)
            if end_time.tzinfo is None:
                end_time = timezone.make_aware(end_time)
                
        except (ValueError, TypeError) as e:
            errors.append(f"Dòng {row_idx + 1}: Định dạng thời gian không hợp lệ. Sử dụng định dạng: YYYY-MM-DD HH:MM:SS")
            self.errors.extend(errors)
            return None
        
        if start_time >= end_time:
            errors.append(f"Dòng {row_idx + 1}: Thời gian bắt đầu phải trước thời gian kết thúc")
            self.errors.extend(errors)
            return None
        
        if errors:
            self.errors.extend(errors)
            return None
        
        return {
            'product': product,
            'flash_price': flash_price,
            'stock': stock,
            'start_time': start_time,
            'end_time': end_time
        }
    
    @transaction.atomic
    def import_flash_sales(self, file):
        """Import flash sales từ file Excel"""
        self.errors = []
        self.warnings = []
        self.created_count = 0
        
        # Bước 1: Kiểm tra file
        if not self.validate_excel_file(file):
            return False
        
        # Bước 2: Đọc file
        df = self.read_excel(file)
        if df is None:
            return False
        
        if len(df) == 0:
            self.errors.append("File Excel không có dữ liệu")
            return False
        
        # Bước 3: Kiểm tra cột
        if not self.validate_columns(df):
            return False
        
        # Bước 4: Xử lý từng dòng
        flash_sales_data = []
        grouped_by_time = {}
        
        for idx, (_, row) in enumerate(df.iterrows()):
            # Bỏ qua dòng trống
            if pd.isna(row['product_id']):
                continue
            
            parsed_data = self.validate_and_parse_row(row, idx)
            if parsed_data is None:
                continue
            
            # Nhóm theo thời gian (mỗi nhóm sẽ tạo 1 FlashSale)
            time_key = (parsed_data['start_time'], parsed_data['end_time'])
            
            if time_key not in grouped_by_time:
                grouped_by_time[time_key] = []
            
            grouped_by_time[time_key].append(parsed_data)
        
        # Bước 5: Tạo Flash Sales
        try:
            for (start_time, end_time), products_data in grouped_by_time.items():
                # Kiểm tra trùng lịch
                overlapping = FlashSale.objects.filter(
                    is_active=True,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()
                
                if overlapping:
                    conflict_start = FlashSale.objects.filter(
                        is_active=True,
                        start_time__lt=end_time,
                        end_time__gt=start_time
                    ).first()
                    self.warnings.append(
                        f"Khoảng thời gian {start_time.strftime('%H:%M %d/%m')} - {end_time.strftime('%H:%M %d/%m')} "
                        f"bị trùng với Flash Sale ID {conflict_start.id}. Bỏ qua nhóm này."
                    )
                    continue
                
                # Tạo FlashSale mới
                flash_sale = FlashSale.objects.create(
                    start_time=start_time,
                    end_time=end_time,
                    is_active=True
                )
                
                # Tạo FlashSaleProduct
                for product_data in products_data:
                    FlashSaleProduct.objects.create(
                        flashsale=flash_sale,
                        product=product_data['product'],
                        flash_price=int(product_data['flash_price']),
                        stock=product_data['stock']
                    )
                
                self.created_count += 1
            
            return len(self.errors) == 0
            
        except Exception as e:
            self.errors.append(f"Lỗi khi tạo Flash Sales: {str(e)}")
            return False
    
    def get_result(self):
        """Trả về kết quả import"""
        return {
            'success': len(self.errors) == 0,
            'created_count': self.created_count,
            'errors': self.errors,
            'warnings': self.warnings,
            'message': f"Import thành công {self.created_count} chương trình Flash Sale" if len(self.errors) == 0 else "Import thất bại"
        }
