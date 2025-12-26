import { useState, useEffect } from 'react';

/**
 * Custom hook để "debounce" một giá trị.
 * Hook này sẽ chỉ cập nhật giá trị trả về sau khi người dùng ngừng tương tác (thay đổi `value`)
 * trong một khoảng thời gian `delay` nhất định.
 * @param {any} value - Giá trị bạn muốn debounce (ví dụ: số lượng sản phẩm).
 * @param {number} delay - Khoảng thời gian chờ (ms) trước khi cập nhật giá trị.
 * @returns {any} - Giá trị đã được debounced.
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập một timeout để cập nhật giá trị debounced sau khoảng thời gian delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timeout nếu giá trị `value` thay đổi.
    // Điều này đảm bảo rằng API chỉ được gọi khi người dùng đã ngừng tương tác.
    return () => clearTimeout(handler);
  }, [value, delay]); // Chạy lại effect này nếu `value` hoặc `delay` thay đổi

  return debouncedValue;
}

export default useDebounce;