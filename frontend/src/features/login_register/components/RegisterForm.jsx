// components/RegisterForm.jsx
import { TextField, Button, Typography, Box } from "@mui/material";
import { useRegister } from "../hooks/useRegister";

export default function RegisterForm({ onClose }) {
  const { form, error, loading, handleChange, handleSubmit } = useRegister(onClose);

  return (
    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <Typography color="error">{error}</Typography>}

      <TextField
        label="Tên đăng nhập"
        name="username"
        value={form.username}
        onChange={handleChange}
        disabled={loading}
        fullWidth
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        disabled={loading}
        fullWidth
      />

      <TextField
        label="Mật khẩu"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        disabled={loading}
        fullWidth
      />

      <TextField
        label="Nhập lại mật khẩu"
        name="password2"
        type="password"
        value={form.password2}
        onChange={handleChange}
        disabled={loading}
        fullWidth
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </Button>

        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Đóng
        </Button>
      </Box>
    </Box>
  );
}
