import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote, ShieldAlert, ShieldCheck, Star } from 'lucide-react';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  company: string;
  companyLogoText: string;
  securityBadge: string;
  ratingScore: number;
  avatarColor: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote: "The zero-knowledge cryptography in Cyberspace passed our internal red-team assessment with flying colors. We migrated all board-level communications and sensitive acquisition decks over in less than two weeks.",
    author: "Dr. Julian Vance",
    role: "Chief Information Security Officer (CISO)",
    company: "CipherFrontier",
    companyLogoText: "CF",
    securityBadge: "Red-Team Assessment Approved",
    ratingScore: 5,
    avatarColor: "bg-emerald-500"
  },
  {
    id: 2,
    quote: "With data sovereignty and global compliance becoming regulatory hurdles, Cyberspace's immutable audit trails and granular read-allowances have saved our security compliance team hundreds of hours.",
    author: "Elena Rostova",
    role: "VP of Risk & Compliance",
    company: "Apex Global",
    companyLogoText: "AG",
    securityBadge: "ISO 27001 & SOC 2 Comply Tech",
    ratingScore: 5,
    avatarColor: "bg-indigo-500"
  },
  {
    id: 3,
    quote: "Most secure storage platforms sacrifice execution speed for absolute protection. Cyberspace delivers both. It feels like an instant local explorer while keeping client-side cryptographic state-of-the-art.",
    author: "Marcus Thorne",
    role: "Principal Cryptography Architect",
    company: "SecureNode Labs",
    companyLogoText: "SN",
    securityBadge: "Advanced Cryptanalysis Verified",
    ratingScore: 5,
    avatarColor: "bg-slate-800"
  },
  {
    id: 4,
    quote: "Sensitive investor documents shouldn't rely on unencrypted server volumes or administrative good-will. Cyberspace's decentralized client decryption ensures our financial records belong exclusively to us.",
    author: "Kenji Takahashi",
    role: "Chief Technology Officer",
    company: "Summit Equity Partners",
    companyLogoText: "SE",
    securityBadge: "FINRA Security Standards Met",
    ratingScore: 5,
    avatarColor: "bg-teal-500"
  }
];

const ROTATION_INTERVAL = 7000; // 7 seconds

const TestimonialCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = () => {
    setDirection('right');
    setIndex((prevIndex) => (prevIndex + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setDirection('left');
    setIndex((prevIndex) => (prevIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, ROTATION_INTERVAL);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  const current = TESTIMONIALS[index];

  // Variants for custom swipe/fading slide effect
  const variants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 60 : -60,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 }
      }
    })
  };

  return (
    <section id="expert-testimonials" className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-60" />
      
      {/* Ambient Blur */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-none">CISO Approved State</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Valued by the world's leading <br />
            <span className="text-emerald-600">security practitioners</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-4 max-w-lg mx-auto">
            See how security architects, risk compliance officers, and tech leaders grade the cryptographic reliability and layout of Cyberspace.
          </p>
        </div>

        {/* Testimonial Stage Wrapper */}
        <div 
          className="max-w-4xl mx-auto relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Card with active state animations */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 md:p-14 shadow-[0_10px_30px_rgba(148,163,184,0.05)] relative overflow-hidden min-h-[380px] md:min-h-[320px] flex flex-col justify-between">
            <Quote className="absolute top-10 right-10 w-24 h-24 text-emerald-500/5 pointer-events-none" />
            
            {/* Slide Animator */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col flex-grow justify-between relative z-10"
              >
                <div>
                  {/* Rating & Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-1">
                      {[...Array(current.ratingScore)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-100/50 text-[10px] font-bold font-mono text-emerald-700 tracking-wider uppercase">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {current.securityBadge}
                    </div>
                  </div>

                  {/* Testimonial Long Quote Text */}
                  <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed italic mb-8">
                    "{current.quote}"
                  </p>
                </div>

                {/* Author Info block */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-slate-200/60 pt-6">
                  <div className="flex items-center gap-4">
                    {/* Compact Custom Avatar with Initials */}
                    <div className={`w-12 h-12 rounded-xl border border-white/20 shadow-md ${current.avatarColor} flex items-center justify-center text-white font-bold tracking-wider text-base`}>
                      {current.companyLogoText}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{current.author}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {current.role} &middot; <span className="text-slate-700">{current.company}</span>
                      </p>
                    </div>
                  </div>

                  {/* Logo Indicator */}
                  <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-200/50 px-3 py-1 rounded">
                    {current.company.toUpperCase()} PROTOCOL
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Simulated Timer Bar at bottom */}
            <div className="absolute left-0 bottom-0 h-1 bg-slate-200 w-full">
              <motion.div 
                key={index}
                initial={{ width: 0 }}
                animate={{ width: isHovered ? '0%' : '100%' }}
                transition={{ duration: isHovered ? 0 : ROTATION_INTERVAL / 1000, ease: 'linear' }}
                className="h-full bg-emerald-500"
              />
            </div>

          </div>

          {/* Left Arrow Controls (Desktop only for precision) */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 p-3 rounded-full transition-all duration-300 shadow-md z-30 focus:outline-none hidden md:block"
            aria-label="Previous Testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Controls (Desktop only for precision) */}
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 p-3 rounded-full transition-all duration-300 shadow-md z-30 focus:outline-none hidden md:block"
            aria-label="Next Testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Pagination Indicators / Buttons */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {TESTIMONIALS.map((testimonial, idx) => (
              <button
                key={testimonial.id}
                onClick={() => {
                  setDirection(idx > index ? 'right' : 'left');
                  setIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                  index === idx 
                    ? 'bg-emerald-600 w-8' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default TestimonialCarousel;
