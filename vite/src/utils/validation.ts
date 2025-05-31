export class ValidationUtil {
  static validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: {
      minLength: boolean;
      hasUpper: boolean;
      hasLower: boolean;
      hasNumber: boolean;
    };
  } {
    const minLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return {
      isValid: minLength && hasUpper && hasLower && hasNumber,
      errors: {
        minLength: !minLength,
        hasUpper: !hasUpper,
        hasLower: !hasLower,
        hasNumber: !hasNumber,
      },
    };
  }

  // static validatePhone(phone: string): boolean {
  //   const re = /^09\d{8}$/;
  //   return re.test(phone);
  // }

  static validateName(name: string): boolean {
    if (!name) return false;
    return name.length >= 2;
  }
}
