import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth } from "../config/firebase";

let recaptchaVerifier = null;

export const initializeRecaptcha = () => {
  if (!recaptchaVerifier) {
    // Correct order for Firebase v9 Modular SDK: auth, container, parameters
    recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved");
        }
      }
    );
  }
};

export const sendPhoneOTP = async (phoneNumber) => {
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA chưa được khởi tạo");
  }

  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    recaptchaVerifier
  );

  return confirmationResult;
};

export const verifyPhoneOTP = async (code) => {
  try {
    if (!window.confirmationResult) {
      throw new Error("Vui lòng gửi mã OTP trước");
    }
    const result = await window.confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    return { success: true, idToken, user: result.user };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    let errorMessage = "Xác thực thất bại";
    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Mã OTP không đúng";
    } else if (error.code === "auth/code-expired") {
      errorMessage = "Mã OTP đã hết hạn";
    }
    return { success: false, error: errorMessage };
  }
};

export const resetRecaptcha = () => {
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
    window.confirmationResult = null;
};