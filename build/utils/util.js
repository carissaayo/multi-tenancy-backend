"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = exports.generateOtp = exports.formatPhoneNumber = void 0;
const formatPhoneNumber = (phoneNumber, countryCode) => {
    let formattedNumber = phoneNumber;
    if (phoneNumber && (countryCode == '234' || countryCode == '+234')) {
        if (phoneNumber.startsWith('+234')) {
            formattedNumber = phoneNumber.replace('+234', '');
        }
        else if (phoneNumber.startsWith('234')) {
            formattedNumber = phoneNumber.replace('234', '');
        }
        if (phoneNumber.startsWith('0') && formattedNumber.length >= 11) {
            formattedNumber = formattedNumber.replace('0', '');
        }
        formattedNumber = '234' + formattedNumber;
    }
    return formattedNumber;
};
exports.formatPhoneNumber = formatPhoneNumber;
const generateOtp = (type, length) => {
    if (type === 'numeric') {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < length; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    }
    else if (type === 'alphanumeric') {
        const string = '0123456789abcdefghijklmnopqrstuvwxyz';
        let OTP = '';
        const len = string.length;
        for (let i = 0; i < length; i++) {
            OTP += string[Math.floor(Math.random() * len)];
        }
        return OTP;
    }
    else if (type === 'alpha') {
        const string = 'abcdefghkmnprstuvwxyz';
        let OTP = '';
        const len = string.length;
        for (let i = 0; i < length; i++) {
            OTP += string[Math.floor(Math.random() * len)];
        }
        return OTP;
    }
    else {
        return '0000';
    }
};
exports.generateOtp = generateOtp;
const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.escapeRegex = escapeRegex;
//# sourceMappingURL=util.js.map