export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: string,
): string => {
  let formattedNumber = phoneNumber;

  // NIGERIA
  if (phoneNumber && (countryCode == '234' || countryCode == '+234')) {
    // remove +234, remove first 0, and add 234 back
    if (phoneNumber.startsWith('+234')) {
      formattedNumber = phoneNumber.replace('+234', '');
    } else if (phoneNumber.startsWith('234')) {
      formattedNumber = phoneNumber.replace('234', '');
    }

    if (phoneNumber.startsWith('0') && formattedNumber.length >= 11) {
      formattedNumber = formattedNumber.replace('0', '');
    }
    formattedNumber = '234' + formattedNumber;
  }

  return formattedNumber;
};

// generate OTP
export const generateOtp = (
  type: 'numeric' | 'alphanumeric' | 'alpha' | string,
  length: number,
): string => {
  // numeric
  if (type === 'numeric') {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }
  // alpha numeric
  else if (type === 'alphanumeric') {
    // let string =
    //   "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const string = '0123456789abcdefghijklmnopqrstuvwxyz';
    let OTP = '';
    const len = string.length;
    for (let i = 0; i < length; i++) {
      OTP += string[Math.floor(Math.random() * len)];
    }
    return OTP;
  } else if (type === 'alpha') {
    // let string =
    //   "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const string = 'abcdefghkmnprstuvwxyz';
    let OTP = '';
    const len = string.length;
    for (let i = 0; i < length; i++) {
      OTP += string[Math.floor(Math.random() * len)];
    }
    return OTP;
  }
  // nothing selected
  else {
    return '0000';
  }
};

export const escapeRegex = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
