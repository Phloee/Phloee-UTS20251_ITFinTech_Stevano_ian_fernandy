// src/utils/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

export const validateCheckoutForm = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  }

  if (!formData.email?.trim()) {
    errors.email = "Email is required";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (!formData.phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (!validatePhone(formData.phone)) {
    errors.phone = "Invalid Indonesian phone number";
  }

  if (!formData.address?.trim()) {
    errors.address = "Address is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
