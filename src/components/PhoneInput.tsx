import React, { useMemo } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CountryOption {
  code: string;
  name: string;
  country: string;
  flag: string;
  pattern: RegExp;
  placeholder: string;
  digits: number;
  hint: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+91', name: 'India', country: 'IN', flag: '🇮🇳', pattern: /^[6-9]\d{9}$/, placeholder: '98765 43210', digits: 10, hint: '10 digits starting with 6, 7, 8, or 9' },
  { code: '+1', name: 'United States', country: 'US', flag: '🇺🇸', pattern: /^[2-9]\d{9}$/, placeholder: '202 555 0123', digits: 10, hint: '10-digit US phone number' },
  { code: '+1', name: 'Canada', country: 'CA', flag: '🇨🇦', pattern: /^[2-9]\d{9}$/, placeholder: '416 555 0123', digits: 10, hint: '10-digit Canadian phone number' },
  { code: '+44', name: 'United Kingdom', country: 'GB', flag: '🇬🇧', pattern: /^[1-9]\d{9,10}$/, placeholder: '7911 123456', digits: 10, hint: '10 to 11 digits' },
  { code: '+971', name: 'UAE', country: 'AE', flag: '🇦🇪', pattern: /^5\d{8}$/, placeholder: '50 123 4567', digits: 9, hint: '9 digits starting with 5' },
  { code: '+61', name: 'Australia', country: 'AU', flag: '🇦🇺', pattern: /^4\d{8}$/, placeholder: '412 345 678', digits: 9, hint: '9 digits starting with 4' },
  { code: '+65', name: 'Singapore', country: 'SG', flag: '🇸🇬', pattern: /^[89]\d{7}$/, placeholder: '8123 4567', digits: 8, hint: '8 digits starting with 8 or 9' },
  { code: '+49', name: 'Germany', country: 'DE', flag: '🇩🇪', pattern: /^[1-9]\d{9,11}$/, placeholder: '151 12345678', digits: 10, hint: '10 to 12 digits' },
  { code: '+33', name: 'France', country: 'FR', flag: '🇫🇷', pattern: /^[1-9]\d{8}$/, placeholder: '6 12 34 56 78', digits: 9, hint: '9 digits' },
  { code: '+966', name: 'Saudi Arabia', country: 'SA', flag: '🇸🇦', pattern: /^5\d{8}$/, placeholder: '50 123 4567', digits: 9, hint: '9 digits starting with 5' },
  { code: '+880', name: 'Bangladesh', country: 'BD', flag: '🇧🇩', pattern: /^1\d{9}$/, placeholder: '1712 345678', digits: 10, hint: '10 digits starting with 1' },
  { code: '+977', name: 'Nepal', country: 'NP', flag: '🇳🇵', pattern: /^9\d{9}$/, placeholder: '984 1234567', digits: 10, hint: '10 digits starting with 9' },
  { code: '+234', name: 'Nigeria', country: 'NG', flag: '🇳🇬', pattern: /^[789]\d{9}$/, placeholder: '802 123 4567', digits: 10, hint: '10 digits starting with 7, 8, or 9' },
  { code: '+60', name: 'Malaysia', country: 'MY', flag: '🇲🇾', pattern: /^1\d{8,9}$/, placeholder: '12 345 6789', digits: 9, hint: '9 to 10 digits' },
  { code: '+81', name: 'Japan', country: 'JP', flag: '🇯🇵', pattern: /^[789]0\d{8}$/, placeholder: '90 1234 5678', digits: 10, hint: '10 to 11 digits' },
  { code: '+86', name: 'China', country: 'CN', flag: '🇨🇳', pattern: /^1\d{10}$/, placeholder: '138 0013 8000', digits: 11, hint: '11 digits starting with 1' },
];

export function validatePhoneInput(countryCode: string, rawNumber: string): { valid: boolean; error?: string; digits: string } {
  const digits = rawNumber.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, error: 'Mobile number is required.', digits: '' };
  }

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.code === countryCode);

  if (countryCode === '+91') {
    if (digits.length !== 10) {
      return { valid: false, error: `Indian mobile number must be 10 digits (${digits.length}/10 entered).`, digits };
    }
    if (!/^[6-9]/.test(digits)) {
      return { valid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9.', digits };
    }
    return { valid: true, digits };
  }

  if (selectedCountry && selectedCountry.pattern) {
    if (!selectedCountry.pattern.test(digits)) {
      return { valid: false, error: `Invalid number format for ${selectedCountry.name}. ${selectedCountry.hint}`, digits };
    }
    return { valid: true, digits };
  }

  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, error: 'Mobile number must be between 7 and 15 digits.', digits };
  }

  return { valid: true, digits };
}

interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  error,
  disabled = false,
  required = true,
  label = 'Mobile Number',
}) => {
  const selectedCountry = useMemo(() => {
    return COUNTRY_OPTIONS.find((c) => c.code === countryCode) || COUNTRY_OPTIONS[0];
  }, [countryCode]);

  const digits = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber]);

  const validation = useMemo(() => {
    if (!phoneNumber) return null;
    return validatePhoneInput(countryCode, phoneNumber);
  }, [countryCode, phoneNumber]);

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and spaces, strip other characters
    const sanitized = raw.replace(/[^\d\s]/g, '');
    onPhoneNumberChange(sanitized);
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#28263A] block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {countryCode === '+91' && digits.length > 0 && (
          <span className="text-[11px] text-[#777589] font-mono">
            {digits.length}/10 digits
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {/* Country Code Dropdown */}
        <div className="relative shrink-0 w-32 sm:w-36">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            disabled={disabled}
            aria-label="Country Code"
            className="w-full appearance-none px-3 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] hover:border-[#D9D2F8] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all cursor-pointer font-sans"
          >
            {COUNTRY_OPTIONS.map((c, idx) => (
              <option key={`${c.country}-${idx}`} value={c.code} className="bg-white text-[#28263A] py-1">
                {c.flag} {c.code} ({c.country})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-[#777589] text-xs">
            ▼
          </div>
        </div>

        {/* Mobile Number Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
            <Phone className="w-4 h-4" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required={required}
            disabled={disabled}
            placeholder={selectedCountry.placeholder}
            value={phoneNumber}
            onChange={handleNumberInput}
            className={`w-full pl-10 pr-9 py-2.5 bg-[#FFFDF9] border rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none transition-all font-mono ${
              error
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                : validation && !validation.valid
                ? 'border-[#E5A044] focus:ring-2 focus:ring-[#FFF0B8]'
                : validation && validation.valid
                ? 'border-[#319B78] focus:ring-2 focus:ring-[#CFF5E7]'
                : 'border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20'
            }`}
          />
          {validation && validation.valid && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#319B78]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Validation status feedback */}
      {error ? (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-600 pt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : validation && !validation.valid && phoneNumber.trim().length > 0 ? (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 pt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{validation.error}</span>
        </div>
      ) : validation && validation.valid ? (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Valid mobile number ({selectedCountry.name})</span>
        </div>
      ) : (
        <p className="text-[10px] text-zinc-500 pl-1">
          {selectedCountry.hint} — Used for account recovery and study updates.
        </p>
      )}
    </div>
  );
};
