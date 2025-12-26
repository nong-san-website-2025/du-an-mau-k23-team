import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth } from "../config/firebase";

let recaptchaVerifier = null;

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  
  if (phone.startsWith("+84")) {
    return phone;
  }
  
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("84")) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  return `+84${cleaned}`;
};

export const initializeRecaptcha = () => {
  if (!recaptchaVerifier) {
    try {
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
    } catch (error) {
      console.error("Error initializing recaptcha:", error);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      throw error;
    }
  }
  return recaptchaVerifier;
};

export const sendPhoneOTP = async (phoneNumber) => {
  if (!recaptchaVerifier) {
    initializeRecaptcha();
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    formattedPhone,
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
        try {
            recaptchaVerifier.clear();
        } catch (err) {
            console.log("Error clearing recaptcha:", err);
        }
        recaptchaVerifier = null;
    }
    
    const container = document.getElementById("recaptcha-container");
    if (container) {
        container.innerHTML = "";
    }
    
    window.confirmationResult = null;
};