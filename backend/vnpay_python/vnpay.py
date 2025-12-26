import hashlib
import hmac
import urllib.parse

class vnpay:
    def __init__(self):
        # Khởi tạo dict để chứa dữ liệu request và response
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, vnpay_payment_url, secret_key):
        """
        Tạo URL thanh toán gửi sang VNPAY
        """
        # Sắp xếp tham số theo a-z (yêu cầu bắt buộc của VNPAY)
        inputData = sorted(self.requestData.items())
        queryString = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                # Dùng quote_plus để biến khoảng trắng thành dấu + (theo chuẩn VNPay)
                queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                queryString = key + '=' + urllib.parse.quote_plus(str(val))

        # Tạo mã băm (Checksum)
        hashValue = self.__hmacsha512(secret_key, queryString)
        
        # Trả về đường dẫn đầy đủ
        return vnpay_payment_url + "?" + queryString + '&vnp_SecureHash=' + hashValue

    def validate_response(self, secret_key):
        """
        Kiểm tra tính toàn vẹn dữ liệu khi VNPAY gọi ngược về (IPN)
        """
        vnp_SecureHash = self.responseData.get('vnp_SecureHash')
        
        # Loại bỏ các tham số hash để tính toán lại
        # Copy dictionary để không ảnh hưởng dữ liệu gốc
        res_data = self.responseData.copy()
        
        if 'vnp_SecureHash' in res_data:
            res_data.pop('vnp_SecureHash')

        if 'vnp_SecureHashType' in res_data:
            res_data.pop('vnp_SecureHashType')

        inputData = sorted(res_data.items())
        hasData = ''
        seq = 0
        
        # Logic tạo chuỗi để hash lại
        for key, val in inputData:
            # Chỉ lấy các tham số bắt đầu bằng vnp_
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))

        hashValue = self.__hmacsha512(secret_key, hasData)

        # In ra log để debug nếu cần thiết
        print(f'Validate debug:\nHasData: {hasData}\nServerHash: {hashValue}\nVNPAYHash: {vnp_SecureHash}')

        return vnp_SecureHash == hashValue

    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()