export const removeVietnameseAccents = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const getProductIdFromCartItem = (item) => {
  if (item.product_data?.id != null) return item.product_data.id;
  if (item.product?.id != null) return item.product.id;
  if (item.product != null) return item.product;
  return null;
};

export const formatProductImage = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `http://localhost:8000${image}`;
  return '';
};
