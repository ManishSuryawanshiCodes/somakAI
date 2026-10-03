'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  User,
  ExternalLink,
  Check,
  Info,
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/components/ToastProvider';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'team';
  const orgSlug = searchParams.get('org');

  const { user } = useAuth();
  const { currentOrg, updateOrgPlan } = useOrg();
  const { addToast } = useToast();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [seats, setSeats] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'test' | 'dodo_hosted'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [cardName, setCardName] = useState(user?.name || 'Marcus Vance');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingZip, setBillingZip] = useState('94105');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'marcus@somak.internal');

  useEffect(() => {
    if (user?.name && !cardName) setCardName(user.name);
    if (user?.email && customerEmail === 'marcus@somak.internal') setCustomerEmail(user.email);
  }, [user, cardName, customerEmail]);

  // Pricing calculations
  // Monthly: $79/seat, Annual: $69/seat billed annually ($828/yr/seat)
  const pricePerSeat = billingCycle === 'monthly' ? 79 : 69;
  const subtotal = seats * pricePerSeat * (billingCycle === 'annual' ? 12 : 1);
  const savings = billingCycle === 'annual' ? seats * (79 - 69) * 12 : 0;
  const vatTax = 0; // B2B reverse charge
  const totalAmount = subtotal + vatTax;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  // Helper to fill demo test card
  const fillDemoCard = () => {
    setCardName(user?.name || 'DevOps Lead');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setBillingZip('94107');
    setErrorMessage('');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        setIsProcessing(false);
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setErrorMessage('Please enter a valid expiration date (MM/YY).');
        setIsProcessing(false);
        return;
      }
      if (cardCvc.length < 3) {
        setErrorMessage('Please enter a valid 3 or 4-digit CVC code.');
        setIsProcessing(false);
        return;
      }
    }

    try {
      // 1. If Dodo hosted checkout is chosen or configured, try calling API
      if (paymentMethod === 'dodo_hosted') {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'team',
            seats,
            customer_email: customerEmail,
            name: cardName,
            billing_cycle: billingCycle,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.checkout_url && !data.checkout_url.includes('session_id')) {
            window.location.href = data.checkout_url;
            return;
          }
        }
      }

      // 2. Simulate / process payment verification
      await new Promise((r) => setTimeout(r, 1200));

      // 3. Update organization plan to team
      try {
        await updateOrgPlan('team');
      } catch (planErr) {
        console.warn('Update plan non-fatal:', planErr);
      }

      addToast('Payment authorized successfully. Welcome to Team tier!', 'success');

      // 4. Redirect to Checkout Success Page
      const sessionId = `dodo_sub_${Date.now()}`;
      router.push(`/checkout/success?plan=team&session_id=${sessionId}&seats=${seats}&cycle=${billingCycle}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment authorization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col relative bg-[#FAF8F5] dark:bg-[#0A0A0A]">
      <TopNav />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8 pb-24">
        {/* Navigation & Trust Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Plans</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted • PCI-DSS Compliant</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upgrade to SOMAK AI Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Activate autonomous AST self-healing, canary gates, and multi-engineer incident collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Summary & Plan Highlights (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-5">
              {/* Plan Header & Billing Toggle */}
              <div className="space-y-3 pb-4 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                    Selected Plan
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-white dark:bg-[#1A1A1E] text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        billingCycle === 'annual'
                          ? 'bg-white dark:bg-[#1A1A1E] text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Annual (-15%)
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Team Tier</h3>
                    <p className="text-xs text-slate-400">Autonomous SRE platform</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      ${pricePerSeat}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      / seat / {billingCycle === 'annual' ? 'mo (billed yr)' : 'month'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat Counter */}
              <div className="space-y-2 pb-4 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Team Seats</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {seats} {seats === 1 ? 'seat' : 'seats'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
                      className="px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="px-2 py-1 text-xs font-mono font-bold min-w-[28px] text-center">
                      {seats}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSeats((prev) => Math.min(25, prev + 1))}
                      className="px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Feature Checklist */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Autonomous canary gates (5% &rarr; 25% &rarr; 100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Nemotron-3 550B MoE AST synthesis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Slack & PagerDuty real-time escalation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tamper-Evident Audit tamper-evident audit logs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Full microVM sandbox pre-flight verification</span>
                </div>
              </div>

              {/* Order Summary Line Items */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>
                    Subtotal ({seats} seats &times; ${pricePerSeat}{' '}
                    {billingCycle === 'annual' ? '&times; 12 mo' : ''})
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Annual discount</span>
                    <span className="font-mono font-medium">-${savings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Estimated Tax / VAT (Reverse Charge)</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">$0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total Due Today</span>
                  <span className="font-mono text-lg text-indigo-600 dark:text-indigo-400">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Merchant of Record Notice */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Payments and subscription billing are securely managed by <strong>Dodo Payments, Inc.</strong> as Merchant of Record. Cancel anytime from Settings.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Payment Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-6">
              
              {/* Payment Method Selector Tabs */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      paymentMethod === 'card'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className="w-4 h-4" />
                      {paymentMethod === 'card' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('test')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      paymentMethod === 'test'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Sparkles className="w-4 h-4" />
                      {paymentMethod === 'test' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">1-Click Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dodo_hosted')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      paymentMethod === 'dodo_hosted'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <ExternalLink className="w-4 h-4" />
                      {paymentMethod === 'dodo_hosted' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Dodo Checkout</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Payment Form */}
              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Contact Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Marcus Vance"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Receipt Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="billing@company.com"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Card Details
                      </label>
                      <button
                        type="button"
                        onClick={fillDemoCard}
                        className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Fill Test Card</span>
                      </button>
                    </div>

                    <div>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full font-mono bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / YY"
                          maxLength={5}
                          className="w-full font-mono bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="CVC"
                          maxLength={4}
                          className="w-full font-mono bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={billingZip}
                        onChange={(e) => setBillingZip(e.target.value)}
                        placeholder="Postal / ZIP Code"
                        className="w-full font-mono bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'test' && (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>1-Click Test Mode Authorization</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Authorizes instant subscription activation without real bank charges. Ideal for local SRE testing, feature verification, and staging environments.
                    </p>
                  </div>
                )}

                {paymentMethod === 'dodo_hosted' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-semibold">
                      <ExternalLink className="w-4 h-4 text-indigo-500" />
                      <span>Redirect to Dodo Payments Hosted Portal</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      You will be redirected to the official hosted checkout by Dodo Payments to complete your payment via Credit Card, Apple Pay, Google Pay, or localized bank methods.
                    </p>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Authorization...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {paymentMethod === 'dodo_hosted'
                            ? `Proceed to Dodo Checkout ($${totalAmount.toLocaleString()})`
                            : `Pay $${totalAmount.toLocaleString()} & Activate Team`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Guaranteed 14-day refund</span>
                  <span>•</span>
                  <span>Instant upgrade</span>
                  <span>•</span>
                  <span>Cancel anytime</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0A0A] flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Loading Checkout...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
