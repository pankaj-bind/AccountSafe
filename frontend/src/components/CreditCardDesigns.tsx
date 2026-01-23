import React, { useState } from 'react';

// ============================================
// CARD DESIGN TYPES
// ============================================

export type CardDesignType = 
  | 'bob' 
  | 'sbi' 
  | 'pnb' 
  | 'animated-liquid' 
  | 'canara' 
  | 'canara-golden' 
  | 'liquid-gradient' 
  | 'boi-horizon' 
  | 'boi-clean' 
  | 'indian-bank' 
  | 'indian-bank-tech' 
  | 'central-bank' 
  | 'central-bank-hub' 
  | 'hdfc' 
  | 'hdfc-geometric';

export interface CardDesignOption {
  id: CardDesignType;
  name: string;
  description: string;
}

export const CARD_DESIGNS: CardDesignOption[] = [
  { id: 'bob', name: 'Bank of Baroda', description: 'Classic orange gradient with circular accents' },
  { id: 'sbi', name: 'SBI Blue', description: 'Deep blue gradient with circular elements' },
  { id: 'pnb', name: 'PNB Maroon', description: 'Rich maroon with gold accent' },
  { id: 'animated-liquid', name: 'Animated Liquid', description: 'Premium animated liquid blobs' },
  { id: 'canara', name: 'Canara Bank', description: 'Blue with yellow arc accent' },
  { id: 'canara-golden', name: 'Canara Golden', description: 'Blue with golden diagonal paths' },
  { id: 'liquid-gradient', name: 'Liquid Gradient', description: 'Animated multi-color blobs' },
  { id: 'boi-horizon', name: 'BOI Horizon', description: 'Ocean blue with saffron wave' },
  { id: 'boi-clean', name: 'BOI Clean', description: 'Clean blue with orange accent' },
  { id: 'indian-bank', name: 'Indian Bank', description: 'Deep blue with orange energy' },
  { id: 'indian-bank-tech', name: 'Indian Bank Tech', description: 'Modern tech bars design' },
  { id: 'central-bank', name: 'Central Bank', description: 'Red and blue slabs' },
  { id: 'central-bank-hub', name: 'Central Bank Hub', description: 'Radar rings design' },
  { id: 'hdfc', name: 'HDFC Minimal', description: 'Corporate navy with red glow' },
  { id: 'hdfc-geometric', name: 'HDFC Geometric', description: 'Geometric blocks design' },
];

// ============================================
// CARD COMPONENT PROPS
// ============================================

export interface CreditCardProps {
  design: CardDesignType;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

// ============================================
// INDIVIDUAL CARD DESIGNS
// ============================================

// 1. Bank of Baroda Design
const BoBCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-bob">
    <div className="arc" />
    <div className="arc secondary" />
    <div className="shine" />
    {children}
    <style>{`
      .card-bob {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #ff9f43 0%, #f97316 48%, #ea580c 100%);
        box-shadow: 0 22px 48px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
      }
      .card-bob::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 44%);
      }
      .card-bob .arc {
        position: absolute;
        right: -160px;
        top: 50%;
        width: 360px;
        height: 360px;
        transform: translateY(-50%);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
      }
      .card-bob .arc.secondary {
        left: -200px;
        bottom: -220px;
        top: auto;
        width: 420px;
        height: 420px;
        background: rgba(0, 0, 0, 0.12);
      }
      .card-bob .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.22), transparent 40%);
      }
    `}</style>
  </div>
);

// 2. SBI Design
const SBICard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-sbi">
    <div className="circle" />
    <div className="circle secondary" />
    <div className="shine" />
    {children}
    <style>{`
      .card-sbi {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 45%, #2563eb 100%);
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
      }
      .card-sbi::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 42%);
      }
      .card-sbi .circle {
        position: absolute;
        right: -160px;
        top: 50%;
        width: 360px;
        height: 360px;
        transform: translateY(-50%);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.14);
      }
      .card-sbi .circle.secondary {
        left: -200px;
        bottom: -220px;
        top: auto;
        width: 420px;
        height: 420px;
        background: rgba(0, 0, 0, 0.15);
      }
      .card-sbi .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent 42%);
      }
    `}</style>
  </div>
);

// 3. PNB Design
const PNBCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-pnb">
    <div className="circle" />
    <div className="circle secondary" />
    <div className="shine" />
    {children}
    <style>{`
      .card-pnb {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #7a1f2b 0%, #8b1e2d 45%, #a11c2a 100%);
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.22);
      }
      .card-pnb::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 42%);
      }
      .card-pnb .circle {
        position: absolute;
        right: -160px;
        top: 50%;
        width: 360px;
        height: 360px;
        transform: translateY(-50%);
        border-radius: 50%;
        background: rgba(255, 215, 0, 0.12);
      }
      .card-pnb .circle.secondary {
        left: -200px;
        bottom: -220px;
        top: auto;
        width: 420px;
        height: 420px;
        background: rgba(0, 0, 0, 0.18);
      }
      .card-pnb .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.22), transparent 42%);
      }
    `}</style>
  </div>
);

// 4. Animated Liquid Design
const AnimatedLiquidCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-animated">
    <div className="card-bg" />
    <div className="liquid-blob blob1" />
    <div className="liquid-blob blob2" />
    <div className="liquid-blob blob3" />
    <div className="hexagon-pattern" />
    <div className="wave-layer">
      <div className="wave" />
      <div className="wave wave2" />
    </div>
    <div className="geometric-shapes">
      <div className="circle-ring ring1" />
      <div className="circle-ring ring2" />
    </div>
    <div className="light-streak" />
    <div className="glow-particles p1" />
    <div className="glow-particles p2" />
    <div className="glow-particles p3" />
    <div className="radial-gradient-overlay" />
    <div className="shimmer-effect" />
    <div className="inner-glow" />
    {children}
    <style>{`
      .card-animated {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 50px 100px rgba(0, 0, 0, 0.6), 0 0 80px rgba(220, 38, 38, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        transform-style: preserve-3d;
      }
      .card-animated:hover {
        transform: rotateY(-5deg) rotateX(5deg) translateY(-10px);
        box-shadow: 0 60px 140px rgba(0, 0, 0, 0.7), 0 0 120px rgba(220, 38, 38, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
      }
      .card-animated .card-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #b91c1c 0%, #dc2626 25%, #ef4444 50%, #dc2626 75%, #b91c1c 100%);
      }
      .card-animated .liquid-blob {
        position: absolute;
        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        filter: blur(30px);
        opacity: 0.5;
        animation: morph 10s ease-in-out infinite;
      }
      .card-animated .blob1 {
        width: 380px;
        height: 380px;
        background: radial-gradient(circle, #f87171 0%, #dc2626 50%, transparent 70%);
        top: -120px;
        right: -100px;
      }
      .card-animated .blob2 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, #991b1b 0%, #b91c1c 50%, transparent 70%);
        bottom: -100px;
        left: -80px;
        animation-delay: 3s;
      }
      .card-animated .blob3 {
        width: 250px;
        height: 250px;
        background: radial-gradient(circle, #ef4444 0%, #dc2626 50%, transparent 70%);
        top: 45%;
        left: 45%;
        transform: translate(-50%, -50%);
        animation-delay: 6s;
      }
      @keyframes morph {
        0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: translate(0, 0) rotate(0deg) scale(1); }
        20% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(20px, -20px) rotate(72deg) scale(1.15); }
        40% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: translate(-15px, 15px) rotate(144deg) scale(0.9); }
        60% { border-radius: 30% 70% 60% 40% / 50% 60% 40% 50%; transform: translate(-20px, -15px) rotate(216deg) scale(1.1); }
        80% { border-radius: 70% 30% 40% 60% / 40% 60% 50% 50%; transform: translate(10px, 10px) rotate(288deg) scale(0.95); }
      }
      .card-animated .hexagon-pattern {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 25px 25px;
        opacity: 0.6;
      }
      .card-animated .wave-layer { position: absolute; width: 200%; height: 100%; bottom: 0; left: 0; }
      .card-animated .wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 120px;
        background: linear-gradient(180deg, transparent 0%, rgba(185, 28, 28, 0.4) 50%, rgba(153, 27, 27, 0.6) 100%);
        border-radius: 50%;
        animation: wave 10s ease-in-out infinite;
      }
      .card-animated .wave2 { animation-delay: 3s; opacity: 0.7; height: 100px; background: linear-gradient(180deg, transparent 0%, rgba(220, 38, 38, 0.3) 50%, rgba(185, 28, 28, 0.5) 100%); }
      @keyframes wave {
        0%, 100% { transform: translateX(-25%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-30px); }
      }
      .card-animated .geometric-shapes { position: absolute; width: 100%; height: 100%; }
      .card-animated .circle-ring { position: absolute; border: 2px solid rgba(255, 255, 255, 0.15); border-radius: 50%; animation: rotate-ring 15s linear infinite; }
      .card-animated .ring1 { width: 180px; height: 180px; top: 20%; left: 60%; }
      .card-animated .ring2 { width: 120px; height: 120px; bottom: 25%; left: 15%; animation-delay: 5s; animation-direction: reverse; }
      @keyframes rotate-ring { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .card-animated .light-streak {
        position: absolute;
        width: 300%;
        height: 300%;
        background: linear-gradient(100deg, transparent 0%, transparent 45%, rgba(255, 255, 255, 0.15) 48%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.15) 52%, transparent 55%, transparent 100%);
        top: -100%;
        left: -100%;
        animation: light-sweep 6s ease-in-out infinite;
      }
      @keyframes light-sweep { 0% { transform: translateX(-50%) translateY(-50%) rotate(25deg); } 100% { transform: translateX(50%) translateY(50%) rotate(25deg); } }
      .card-animated .glow-particles {
        position: absolute;
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(248, 113, 113, 0.8), 0 0 40px rgba(220, 38, 38, 0.6);
        animation: particle-drift 8s ease-in-out infinite;
      }
      .card-animated .p1 { top: 20%; left: 25%; animation-delay: 0s; }
      .card-animated .p2 { top: 65%; left: 70%; animation-delay: 2s; }
      .card-animated .p3 { top: 40%; left: 80%; animation-delay: 4s; }
      @keyframes particle-drift {
        0%, 100% { transform: translate(0, 0) scale(0); opacity: 0; }
        50% { transform: translate(40px, -40px) scale(1.5); opacity: 1; }
      }
      .card-animated .radial-gradient-overlay { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 60%); mix-blend-mode: overlay; }
      .card-animated .shimmer-effect { position: absolute; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%); animation: shimmer-slide 4s ease-in-out infinite; }
      @keyframes shimmer-slide { 0% { transform: translateX(-100%) translateY(-100%); } 100% { transform: translateX(100%) translateY(100%); } }
      .card-animated .inner-glow { position: absolute; width: calc(100% - 6px); height: calc(100% - 6px); top: 3px; left: 3px; border-radius: 20px; box-shadow: inset 0 0 80px rgba(248, 113, 113, 0.3), inset 0 0 40px rgba(220, 38, 38, 0.2); pointer-events: none; }
    `}</style>
  </div>
);

// 5. Canara Bank Design
const CanaraCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-canara">
    <div className="arc" />
    <div className="arc secondary" />
    <div className="shine" />
    {children}
    <style>{`
      .card-canara {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #0f4c81 0%, #1f6fb2 50%, #2b7fc4 100%);
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
      }
      .card-canara::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 42%);
      }
      .card-canara .arc {
        position: absolute;
        right: -170px;
        top: 50%;
        width: 380px;
        height: 380px;
        transform: translateY(-50%);
        border-radius: 50%;
        background: rgba(255, 204, 0, 0.22);
      }
      .card-canara .arc.secondary {
        left: -210px;
        bottom: -230px;
        top: auto;
        width: 430px;
        height: 430px;
        background: rgba(0, 0, 0, 0.16);
      }
      .card-canara .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.24), transparent 42%);
      }
    `}</style>
  </div>
);

// 6. Canara Golden Design
const CanaraGoldenCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-canara-golden">
    <div className="path path-1" />
    <div className="path path-2" />
    <div className="shimmer" />
    {children}
    <style>{`
      .card-canara-golden {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 25px 45px rgba(0, 80, 150, 0.3), 0 10px 15px rgba(0, 0, 0, 0.05);
        background: linear-gradient(135deg, #0060ac 0%, #0085ca 100%);
      }
      .card-canara-golden .path {
        position: absolute;
        width: 130px;
        height: 600px;
        border-radius: 100px;
        background: linear-gradient(to bottom, #ffcc00, #ffdb4d);
        mix-blend-mode: hard-light;
        opacity: 0.85;
        filter: blur(1px);
      }
      .card-canara-golden .path-1 { top: -160px; left: 70px; transform: rotate(35deg); }
      .card-canara-golden .path-2 { top: -190px; left: -30px; transform: rotate(-35deg); opacity: 0.7; }
      .card-canara-golden .shimmer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent 35%, rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.15) 55%, transparent 65%);
        pointer-events: none;
      }
    `}</style>
  </div>
);

// 7. Liquid Gradient Design
const LiquidGradientCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-liquid">
    <div className="blob blob-1" />
    <div className="blob blob-2" />
    <div className="blob blob-3" />
    <div className="overlay" />
    {children}
    <style>{`
      .card-liquid {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e);
      }
      .card-liquid .blob {
        position: absolute;
        filter: blur(40px);
        opacity: 0.8;
        mix-blend-mode: screen;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      .card-liquid .blob-1 {
        width: 250px;
        height: 250px;
        top: -100px;
        left: -50px;
        background: linear-gradient(to right, #ff4b1f, #ff9068);
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
        animation: rotate-blob 20s linear infinite;
      }
      .card-liquid .blob-2 {
        width: 300px;
        height: 300px;
        bottom: -120px;
        right: -80px;
        background: linear-gradient(to right, #00c6ff, #0072ff);
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        animation: rotate-blob-reverse 25s linear infinite;
      }
      .card-liquid .blob-3 {
        width: 150px;
        height: 150px;
        top: 50%;
        left: 50%;
        background: linear-gradient(to right, #8e2de2, #4a00e0);
        border-radius: 50%;
        animation: move-blob 15s linear infinite;
      }
      @keyframes rotate-blob {
        0% { transform: rotate(0deg) scale(1); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
        50% { transform: rotate(180deg) scale(1.1); border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
        100% { transform: rotate(360deg) scale(1); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
      }
      @keyframes rotate-blob-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
      @keyframes move-blob {
        0% { transform: translate(-50%, -50%) translate(-30px, -20px); }
        50% { transform: translate(-50%, -50%) translate(30px, 20px); }
        100% { transform: translate(-50%, -50%) translate(-30px, -20px); }
      }
      .card-liquid .overlay {
        position: absolute;
        inset: 0;
        box-shadow: inset 0 0 20px rgba(255,255,255,0.1);
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.05) 100%);
        pointer-events: none;
      }
    `}</style>
  </div>
);

// 8. BOI Horizon Design
const BOIHorizonCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-boi-horizon">
    <div className="wave-blue" />
    <div className="wave-orange" />
    <div className="accent-line" />
    <div className="texture" />
    {children}
    <style>{`
      .card-boi-horizon {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 45, 98, 0.4), 0 10px 10px rgba(0, 0, 0, 0.05);
        background: linear-gradient(to bottom, #003b64, #005f99);
      }
      .card-boi-horizon .wave-orange {
        position: absolute;
        bottom: -60%;
        left: -10%;
        width: 120%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, #ff8c00, #ff5e00);
        box-shadow: 0 -10px 30px rgba(255, 94, 0, 0.3);
        transform: rotate(-5deg);
      }
      .card-boi-horizon .wave-blue {
        position: absolute;
        top: -60%;
        right: -20%;
        width: 140%;
        height: 90%;
        border-radius: 50%;
        background: linear-gradient(180deg, #009ceb, #0077b6);
        opacity: 0.2;
        transform: rotate(-15deg);
      }
      .card-boi-horizon .accent-line {
        position: absolute;
        bottom: 35%;
        left: 0;
        width: 100%;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(-5deg);
        transform-origin: left;
      }
      .card-boi-horizon .texture {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
        z-index: 2;
      }
    `}</style>
  </div>
);

// 9. BOI Clean Design
const BOICleanCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-boi-clean">
    <div className="accent" />
    <div className="counter" />
    <div className="geometry" />
    <div className="shine" />
    {children}
    <style>{`
      .card-boi-clean {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #0c3b66 0%, #0f4c81 55%, #103f6e 100%);
        box-shadow: 0 24px 55px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.22);
      }
      .card-boi-clean .geometry {
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 32%, transparent 34%), linear-gradient(300deg, transparent 0%, rgba(0,0,0,0.18) 45%, transparent 47%);
      }
      .card-boi-clean .accent {
        position: absolute;
        top: -120px;
        right: -160px;
        width: 360px;
        height: 360px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(249,115,22,0.55), rgba(249,115,22,0.15), transparent 65%);
      }
      .card-boi-clean .counter {
        position: absolute;
        bottom: -140px;
        left: -180px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: rgba(0,0,0,0.22);
      }
      .card-boi-clean .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.18), transparent 42%);
      }
    `}</style>
  </div>
);

// 10. Indian Bank Design
const IndianBankCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-indian-bank">
    <div className="counter" />
    <div className="accent" />
    <div className="flow" />
    <div className="shine" />
    {children}
    <style>{`
      .card-indian-bank {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #003a8f 0%, #004aad 55%, #00366f 100%);
        box-shadow: 0 26px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.22);
      }
      .card-indian-bank .flow {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 48%, transparent 52%);
      }
      .card-indian-bank .accent {
        position: absolute;
        bottom: -160px;
        right: -180px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,122,0,0.55), rgba(255,122,0,0.20), transparent 65%);
      }
      .card-indian-bank .counter {
        position: absolute;
        top: -140px;
        left: -180px;
        width: 380px;
        height: 380px;
        border-radius: 50%;
        background: rgba(0,0,0,0.25);
      }
      .card-indian-bank .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.18), transparent 40%);
      }
    `}</style>
  </div>
);

// 11. Indian Bank Tech Design
const IndianBankTechCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-indian-bank-tech">
    <div className="bars-container">
      <div className="bar" />
      <div className="bar" />
      <div className="hero-bar" />
      <div className="bar" />
      <div className="bar" />
    </div>
    <div className="scan-line" />
    <div className="noise" />
    {children}
    <style>{`
      .card-indian-bank-tech {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 40, 85, 0.4), 0 10px 10px rgba(0, 0, 0, 0.05);
        background: linear-gradient(to right, #0a1f44, #122b5e);
      }
      .card-indian-bank-tech .bars-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        transform: skewX(-20deg) scale(1.2);
      }
      .card-indian-bank-tech .bar {
        height: 120%;
        width: 40px;
        background: rgba(255, 255, 255, 0.03);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
      }
      .card-indian-bank-tech .bar:nth-child(1) { width: 60px; background: rgba(255,255,255,0.02); }
      .card-indian-bank-tech .bar:nth-child(2) { width: 20px; background: rgba(255,255,255,0.05); }
      .card-indian-bank-tech .bar:nth-child(4) { width: 30px; background: rgba(255,255,255,0.04); }
      .card-indian-bank-tech .bar:nth-child(5) { width: 80px; background: rgba(255,255,255,0.01); }
      .card-indian-bank-tech .hero-bar {
        width: 12px;
        height: 120%;
        background: linear-gradient(to bottom, #ff9933, #ff6600);
        box-shadow: 0 0 25px rgba(255, 102, 0, 0.6);
        z-index: 2;
      }
      .card-indian-bank-tech .scan-line {
        position: absolute;
        top: 40%;
        left: 0;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        opacity: 0.3;
      }
      .card-indian-bank-tech .noise {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E");
        mix-blend-mode: overlay;
      }
    `}</style>
  </div>
);

// 12. Central Bank Design
const CentralBankCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-central-bank">
    <div className="red-slab" />
    <div className="blue-slab" />
    <div className="divider" />
    <div className="shine" />
    {children}
    <style>{`
      .card-central-bank {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        box-shadow: 0 26px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.22);
      }
      .card-central-bank .red-slab {
        position: absolute;
        top: -40px;
        left: -120px;
        width: 420px;
        height: 200px;
        transform: rotate(-8deg);
        background: linear-gradient(135deg, #8b1e2d, #b91c1c);
        opacity: 0.95;
      }
      .card-central-bank .blue-slab {
        position: absolute;
        bottom: -60px;
        right: -160px;
        width: 460px;
        height: 240px;
        transform: rotate(-8deg);
        background: linear-gradient(135deg, #1e3a8a, #1e40af);
        opacity: 0.9;
      }
      .card-central-bank .divider {
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.08) 42%, transparent 44%);
      }
      .card-central-bank .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.16), transparent 40%);
      }
    `}</style>
  </div>
);

// 13. Central Bank Hub Design
const CentralBankHubCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-central-hub">
    <div className="texture" />
    <div className="core-glow" />
    <div className="ring r1" />
    <div className="ring r2" />
    <div className="ring r3" />
    <div className="ring r4" />
    <div className="sweep" />
    {children}
    <style>{`
      .card-central-hub {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 25px 45px rgba(0, 40, 85, 0.4), 0 10px 10px rgba(0, 0, 0, 0.05);
        background: radial-gradient(circle at 50% 50%, #003366 0%, #001f3f 100%);
      }
      .card-central-hub .core-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #DA291C;
        box-shadow: 0 0 60px 20px rgba(218, 41, 28, 0.6);
        transform: translate(-50%, -50%);
        z-index: 1;
      }
      .card-central-hub .ring {
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      }
      .card-central-hub .r1 { width: 100px; height: 100px; border-color: rgba(218, 41, 28, 0.8); border-width: 2px; }
      .card-central-hub .r2 { width: 180px; height: 180px; border-color: rgba(218, 41, 28, 0.4); }
      .card-central-hub .r3 { width: 280px; height: 280px; border-color: rgba(255, 255, 255, 0.1); }
      .card-central-hub .r4 { width: 450px; height: 450px; border-color: rgba(255, 255, 255, 0.05); border-width: 40px; border-style: solid; border-radius: 50%; border-top-color: transparent; border-bottom-color: transparent; transform: translate(-50%, -50%) rotate(45deg); }
      .card-central-hub .sweep {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300px;
        height: 300px;
        background: conic-gradient(from 0deg, transparent 0deg, rgba(218, 41, 28, 0.1) 60deg, transparent 90deg);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        mix-blend-mode: screen;
      }
      .card-central-hub .texture {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
        opacity: 0.2;
        pointer-events: none;
      }
    `}</style>
  </div>
);

// 14. HDFC Minimal Design
const HDFCCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-hdfc">
    <div className="edge-glow" />
    <div className="depth" />
    <div className="shine" />
    <div className="grain" />
    {children}
    <style>{`
      .card-hdfc {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: radial-gradient(circle at top left, #122b46 0%, #0b1f33 55%, #071726 100%);
        box-shadow: 0 30px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.16);
      }
      .card-hdfc .edge-glow {
        position: absolute;
        top: -120px;
        right: -120px;
        width: 360px;
        height: 360px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(220,38,38,0.45), rgba(220,38,38,0.18), transparent 65%);
      }
      .card-hdfc .depth {
        position: absolute;
        bottom: -160px;
        left: -180px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: rgba(0,0,0,0.35);
      }
      .card-hdfc .shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent 38%);
      }
      .card-hdfc .grain {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px);
        opacity: 0.5;
      }
    `}</style>
  </div>
);

// 15. HDFC Geometric Design
const HDFCGeometricCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="card-hdfc-geo">
    <div className="grid-pattern" />
    <div className="block block-dark" />
    <div className="block block-blue" />
    <div className="block block-red" />
    <div className="digital-square" />
    <div className="gloss" />
    {children}
    <style>{`
      .card-hdfc-geo {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 25px 45px rgba(0, 50, 100, 0.3), 0 10px 10px rgba(0, 0, 0, 0.05);
        background: linear-gradient(135deg, #004c8f 0%, #003366 100%);
      }
      .card-hdfc-geo .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 0.5;
      }
      .card-hdfc-geo .block {
        position: absolute;
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      }
      .card-hdfc-geo .block-red {
        width: 120px;
        height: 400px;
        background: linear-gradient(to bottom, #ed2939, #c41e2b);
        top: -50px;
        left: 80px;
        transform: rotate(25deg);
        z-index: 2;
        opacity: 0.95;
      }
      .card-hdfc-geo .block-blue {
        width: 140px;
        height: 400px;
        background: linear-gradient(to bottom, #2b7de0, #004c8f);
        top: -80px;
        left: 140px;
        transform: rotate(25deg);
        z-index: 1;
        opacity: 0.6;
      }
      .card-hdfc-geo .block-dark {
        width: 100px;
        height: 400px;
        background: rgba(0, 0, 0, 0.2);
        top: -50px;
        left: 40px;
        transform: rotate(25deg);
        z-index: 0;
      }
      .card-hdfc-geo .digital-square {
        position: absolute;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        transform: rotate(45deg);
      }
      .card-hdfc-geo .digital-square::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        background: rgba(255, 255, 255, 0.05);
      }
      .card-hdfc-geo .gloss {
        position: absolute;
        top: -100px;
        left: -100px;
        width: 300px;
        height: 600px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transform: rotate(25deg);
        pointer-events: none;
        mix-blend-mode: overlay;
      }
    `}</style>
  </div>
);

// ============================================
// CARD DETAILS OVERLAY
// ============================================

interface CardDetailsOverlayProps {
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  showDetails?: boolean;
}

const CardDetailsOverlay: React.FC<CardDetailsOverlayProps> = ({
  cardNumber = '•••• •••• •••• ••••',
  cardHolder = 'CARD HOLDER',
  expiryDate = 'MM/YY',
  cvv,
  showDetails = true,
}) => {
  if (!showDetails) return null;

  const formatCardNumber = (num: string) => {
    if (num === '•••• •••• •••• ••••') return num;
    const cleaned = num.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  return (
    <div className="card-details-overlay">
      <div className="chip">
        <div className="chip-line" />
        <div className="chip-line" />
        <div className="chip-line" />
        <div className="chip-line" />
      </div>
      
      <div className="card-number">{formatCardNumber(cardNumber)}</div>
      
      <div className="card-info">
        <div className="card-holder">
          <span className="label">Card Holder</span>
          <span className="value">{cardHolder}</span>
        </div>
        <div className="card-expiry">
          <span className="label">Expires</span>
          <span className="value">{expiryDate}</span>
        </div>
      </div>
      
      <style>{`
        .card-details-overlay {
          position: absolute;
          inset: 0;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          font-family: 'Courier New', monospace;
          z-index: 10;
        }
        .card-details-overlay .chip {
          width: 50px;
          height: 40px;
          background: linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ffd700 100%);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
          padding: 6px;
        }
        .card-details-overlay .chip-line {
          height: 4px;
          background: linear-gradient(90deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1), rgba(0,0,0,0.2));
          border-radius: 2px;
        }
        .card-details-overlay .card-number {
          font-size: 22px;
          letter-spacing: 3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          font-weight: 500;
        }
        .card-details-overlay .card-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .card-details-overlay .card-holder,
        .card-details-overlay .card-expiry {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-details-overlay .label {
          font-size: 10px;
          text-transform: uppercase;
          opacity: 0.7;
          letter-spacing: 1px;
        }
        .card-details-overlay .value {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

// ============================================
// MAIN CREDIT CARD COMPONENT
// ============================================

export const CreditCard: React.FC<CreditCardProps> = ({
  design,
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  showDetails = true,
  className = '',
  onClick,
}) => {
  const renderCard = () => {
    const detailsOverlay = (
      <CardDetailsOverlay
        cardNumber={cardNumber}
        cardHolder={cardHolder}
        expiryDate={expiryDate}
        cvv={cvv}
        showDetails={showDetails}
      />
    );

    switch (design) {
      case 'bob': return <BoBCard>{detailsOverlay}</BoBCard>;
      case 'sbi': return <SBICard>{detailsOverlay}</SBICard>;
      case 'pnb': return <PNBCard>{detailsOverlay}</PNBCard>;
      case 'animated-liquid': return <AnimatedLiquidCard>{detailsOverlay}</AnimatedLiquidCard>;
      case 'canara': return <CanaraCard>{detailsOverlay}</CanaraCard>;
      case 'canara-golden': return <CanaraGoldenCard>{detailsOverlay}</CanaraGoldenCard>;
      case 'liquid-gradient': return <LiquidGradientCard>{detailsOverlay}</LiquidGradientCard>;
      case 'boi-horizon': return <BOIHorizonCard>{detailsOverlay}</BOIHorizonCard>;
      case 'boi-clean': return <BOICleanCard>{detailsOverlay}</BOICleanCard>;
      case 'indian-bank': return <IndianBankCard>{detailsOverlay}</IndianBankCard>;
      case 'indian-bank-tech': return <IndianBankTechCard>{detailsOverlay}</IndianBankTechCard>;
      case 'central-bank': return <CentralBankCard>{detailsOverlay}</CentralBankCard>;
      case 'central-bank-hub': return <CentralBankHubCard>{detailsOverlay}</CentralBankHubCard>;
      case 'hdfc': return <HDFCCard>{detailsOverlay}</HDFCCard>;
      case 'hdfc-geometric': return <HDFCGeometricCard>{detailsOverlay}</HDFCGeometricCard>;
      default: return <SBICard>{detailsOverlay}</SBICard>;
    }
  };

  return (
    <div
      className={`credit-card-wrapper ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {renderCard()}
      <style>{`
        .credit-card-wrapper {
          width: 380px;
          height: 240px;
          perspective: 1200px;
        }
      `}</style>
    </div>
  );
};

// ============================================
// CARD DESIGN SELECTOR COMPONENT
// ============================================

export interface CardDesignSelectorProps {
  selectedDesign: CardDesignType;
  onSelectDesign: (design: CardDesignType) => void;
  showPreview?: boolean;
  cardDetails?: {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
  };
}

export const CardDesignSelector: React.FC<CardDesignSelectorProps> = ({
  selectedDesign,
  onSelectDesign,
  showPreview = true,
  cardDetails,
}) => {
  return (
    <div className="card-design-selector">
      {showPreview && (
        <div className="preview-section">
          <h3 className="preview-title">Preview</h3>
          <div className="preview-card">
            <CreditCard
              design={selectedDesign}
              cardNumber={cardDetails?.cardNumber}
              cardHolder={cardDetails?.cardHolder}
              expiryDate={cardDetails?.expiryDate}
              showDetails={true}
            />
          </div>
        </div>
      )}
      
      <div className="designs-grid">
        <h3 className="designs-title">Select Card Design</h3>
        <div className="designs-list">
          {CARD_DESIGNS.map((design) => (
            <button
              key={design.id}
              className={`design-option ${selectedDesign === design.id ? 'selected' : ''}`}
              onClick={() => onSelectDesign(design.id)}
            >
              <div className="mini-card">
                <CreditCard design={design.id} showDetails={false} />
              </div>
              <div className="design-info">
                <span className="design-name">{design.name}</span>
                <span className="design-desc">{design.description}</span>
              </div>
              {selectedDesign === design.id && (
                <div className="selected-indicator">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#22c55e" />
                    <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        .card-design-selector {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        .preview-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .preview-title, .designs-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .preview-card {
          display: flex;
          justify-content: center;
        }
        .designs-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .designs-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .design-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          position: relative;
        }
        .design-option:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .design-option.selected {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .mini-card {
          width: 100px;
          height: 63px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .mini-card .credit-card-wrapper {
          width: 100% !important;
          height: 100% !important;
        }
        .design-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .design-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        .design-desc {
          font-size: 12px;
          color: #6b7280;
        }
        .selected-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
        }
        
        @media (max-width: 640px) {
          .card-design-selector {
            padding: 16px;
          }
          .designs-list {
            grid-template-columns: 1fr;
          }
          .preview-card .credit-card-wrapper {
            width: 320px !important;
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// DEMO COMPONENT
// ============================================

export const CreditCardDesignsDemo: React.FC = () => {
  const [selectedDesign, setSelectedDesign] = useState<CardDesignType>('animated-liquid');
  const [cardDetails] = useState({
    cardNumber: '4532 1234 5678 9012',
    cardHolder: 'JOHN DOE',
    expiryDate: '12/28',
  });

  return (
    <div className="demo-container">
      <h1 className="demo-title">Credit Card Designs</h1>
      <p className="demo-subtitle">Select a card design for your vault</p>
      
      <CardDesignSelector
        selectedDesign={selectedDesign}
        onSelectDesign={setSelectedDesign}
        showPreview={true}
        cardDetails={cardDetails}
      />
      
      <style>{`
        .demo-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 40px 20px;
        }
        .demo-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }
        .demo-subtitle {
          text-align: center;
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px 0;
        }
      `}</style>
    </div>
  );
};

export default CreditCard;
