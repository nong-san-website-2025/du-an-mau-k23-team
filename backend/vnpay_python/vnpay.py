import hashlib
import hmac
import urllib.parse

class vnpay:
    def __init__(self):
        # Chuyển vào hàm init để mỗi lần gọi là một biến mới riêng biệt
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
        if 'vnp_SecureHash' in self.responseData:
            self.responseData.pop('vnp_SecureHash')

        if 'vnp_SecureHashType' in self.responseData:
            self.responseData.pop('vnp_SecureHashType')

        inputData = sorted(self.responseData.items())
        hasData = ''
        seq = 0
        
        # Logic tạo chuỗi để hash lại
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))

        hashValue = self.__hmacsha512(secret_key, hasData)

        print(f'Validate debug:\nHasData: {hasData}\nServerHash: {hashValue}\nVNPAYHash: {vnp_SecureHash}')

        return vnp_SecureHash == hashValue

    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()