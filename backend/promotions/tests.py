from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
import pandas as pd
import openpyxl
from io import BytesIO

from .models import FlashSale, FlashSaleProduct
from products.models import Product, Category, Subcategory
from sellers.models import Seller

User = get_user_model()


class FlashSaleExcelImportTestCase(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        
        self.seller = Seller.objects.create(
            user=self.admin_user,
            store_name='Test Store'
        )
        
        self.category = Category.objects.create(name='Test Category')
        self.subcategory = Subcategory.objects.create(
            name='Test Subcategory',
            category=self.category
        )
        
        self.product1 = Product.objects.create(
            seller=self.seller,
            category=self.category,
            subcategory=self.subcategory,
            name='Test Product 1',
            description='Description 1',
            original_price=100000,
            stock=500
        )
        
        self.product2 = Product.objects.create(
            seller=self.seller,
            category=self.category,
            subcategory=self.subcategory,
            name='Test Product 2',
            description='Description 2',
            original_price=200000,
            stock=300
        )
    
    def create_test_excel_file(self, data=None):
        """Tạo file Excel test"""
        if data is None:
            now = timezone.now()
            start = now + timedelta(days=1)
            end = start + timedelta(hours=2)
            
            data = [
                {
                    'product_id': self.product1.id,
                    'product_name': self.product1.name,
                    'flash_price': 50000,
                    'stock': 100,
                    'start_time': start.strftime('%Y-%m-%d %H:%M:%S'),
                    'end_time': end.strftime('%Y-%m-%d %H:%M:%S'),
                },
                {
                    'product_id': self.product2.id,
                    'product_name': self.product2.name,
                    'flash_price': 150000,
                    'stock': 50,
                    'start_time': start.strftime('%Y-%m-%d %H:%M:%S'),
                    'end_time': end.strftime('%Y-%m-%d %H:%M:%S'),
                }
            ]
        
        df = pd.DataFrame(data)
        excel_file = BytesIO()
        df.to_excel(excel_file, index=False)
        excel_file.seek(0)
        excel_file.name = 'test_flash_sale.xlsx'
        return excel_file
    
    def test_template_download(self):
        """Test tải template Excel"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/promotions/flash-sale/template/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    def test_import_flash_sale_success(self):
        """Test import Flash Sale thành công"""
        self.client.force_authenticate(user=self.admin_user)
        
        excel_file = self.create_test_excel_file()
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['created_count'], 1)
        
        flash_sales = FlashSale.objects.all()
        self.assertEqual(flash_sales.count(), 1)
        
        flash_sale = flash_sales.first()
        self.assertEqual(flash_sale.flashsale_products.count(), 2)
    
    def test_import_without_file(self):
        """Test import mà không gửi file"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post('/api/promotions/flash-sale/import/')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
    
    def test_import_requires_admin(self):
        """Test import yêu cầu quyền admin"""
        normal_user = User.objects.create_user(
            username='normaluser',
            email='normal@test.com',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=normal_user)
        excel_file = self.create_test_excel_file()
        
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 403)
    
    def test_import_invalid_excel_format(self):
        """Test import file không phải Excel"""
        self.client.force_authenticate(user=self.admin_user)
        
        invalid_file = BytesIO(b'Not an Excel file')
        invalid_file.name = 'test.txt'
        
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': invalid_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
    
    def test_import_missing_required_columns(self):
        """Test import file thiếu cột bắt buộc"""
        self.client.force_authenticate(user=self.admin_user)
        
        df = pd.DataFrame({
            'product_id': [self.product1.id],
        })
        excel_file = BytesIO()
        df.to_excel(excel_file, index=False)
        excel_file.seek(0)
        excel_file.name = 'test.xlsx'
        
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
    
    def test_import_invalid_product_id(self):
        """Test import với product_id không tồn tại"""
        self.client.force_authenticate(user=self.admin_user)
        
        now = timezone.now()
        start = now + timedelta(days=1)
        end = start + timedelta(hours=2)
        
        data = {
            'product_id': 99999,
            'product_name': 'Invalid Product',
            'flash_price': 50000,
            'stock': 100,
            'start_time': start.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': end.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        excel_file = self.create_test_excel_file([data])
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
    
    def test_import_invalid_flash_price(self):
        """Test import với flash_price >= original_price"""
        self.client.force_authenticate(user=self.admin_user)
        
        now = timezone.now()
        start = now + timedelta(days=1)
        end = start + timedelta(hours=2)
        
        data = {
            'product_id': self.product1.id,
            'product_name': self.product1.name,
            'flash_price': 100000,
            'stock': 100,
            'start_time': start.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': end.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        excel_file = self.create_test_excel_file([data])
        response = self.client.post(
            '/api/promotions/flash-sale/import/',
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
