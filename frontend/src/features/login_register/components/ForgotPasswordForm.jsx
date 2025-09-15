// src/features/auth/pages/ForgotPassword.jsx
import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Modal,
} from "@mui/material";
import { useForgotPassword } from "../hooks/useForgotPassword";

export default function ForgotPasswordForm() {
  const { loading, error, sendResetEmail } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await sendResetEmail(email);
    if (res.success) {
      setModalMessage(res.message);
      setOpenModal(true);
      setEmail(""); // clear input
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        background: "none",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: "100%",
          borderRadius: 3,
          boxShadow: 0,
          position: "relative", // để dễ overlay modal nếu muốn
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
          Quên mật khẩu
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
          textAlign="center"
        >
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ py: 1.2, fontWeight: "bold" }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </form>
      </Paper>

      {/* Modal thông báo */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 3,
            width: "90%",
            maxWidth: 400,
            textAlign: "center",
            boxShadow: 24,
          }}
        >
          <Typography id="modal-title" variant="h6" mb={2}>
            Thông báo
          </Typography>
          <Typography id="modal-description" mb={3}>
            {modalMessage}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenModal(false)}
            fullWidth
          >
            Đóng
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
