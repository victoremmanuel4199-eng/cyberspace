import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  FolderLock, 
  Check, 
  Lock, 
  Activity, 
  Search, 
  FileText, 
  Share2, 
  Users, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  FileCheck,
  Eye,
  FileCode,
  Tag
} from 'lucide-react';

type BenefitTab = 'security' | 'access' | 'organization';

const ValueProposition: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BenefitTab>('security');

  const benefitDetails = {
    security: {
      badge: 'Uncompromising Protection',
      title: 'Enhanced Security Protocols',
      description: 'Your document payload is encrypted locally on your device before it ever touches our servers. Secured under military-grade AES-256 standard, unauthorized keys and third parties are kept locked out permanently.',
      bullets: [
        'End-to-End Cryptographic Zero-Knowledge Architecture',
        'Granular file-level access controls & permissions',
        'Immutable audit logs tracking every read and edit action'
      ],
      mockupTitle: 'End-to-End Cryptography Engine',
      mockupStatus: 'Active & Shielded',
      mockupStatusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      files: [
        { name: 'Board_Meeting_Minutes_2026.pdf', meta: 'AES-256 Encrypted', date: 'Just now', icon: <FileText className="w-4 h-4 text-emerald-400" />, status: 'Verified' },
        { name: 'Strategic_Acquisition_Termsheet.docx', meta: 'Zero-Knowledge Secured', date: '2 min ago', icon: <FolderLock className="w-4 h-4 text-indigo-400" />, status: 'Shielded' },
        { name: 'Corporate_IP_Private_Key.pem', meta: 'Hardware Sealed', date: '10 min ago', icon: <Lock className="w-4 h-4 text-rose-400" />, status: 'Encrypted' }
      ]
    },
    access: {
      badge: 'Lightning-Fast Distribution',
      title: 'Easy, Frictionless Access',
      description: 'Zero-trust doesn’t mean zero-velocity. Access your secured credentials and mission-critical assets from any authenticated node, anywhere on Earth, with secure link sharing and offline capabilities.',
      bullets: [
        'Offline fallback access with automatic master state sync',
        'Secure shareable links with custom expiration & single-use tokens',
        'Multi-device responsive applet optimized for modern workforces'
      ],
      mockupTitle: 'High-Velocity Secure Node Portal',
      mockupStatus: 'Sync Synchronized',
      mockupStatusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      files: [
        { name: 'Investor_Relations_Deck_V3.pdf', meta: 'Access link active', date: '30s ago', icon: <Share2 className="w-4 h-4 text-amber-400" />, status: 'Shared' },
        { name: 'Product_Launch_Milestones_Slide.key', meta: 'Synced on 14 devices', date: '5 min ago', icon: <Zap className="w-4 h-4 text-yellow-400" />, status: 'Live' },
        { name: 'Offline_Encrypted_Backup_V2.bin', meta: 'Localized Offline Cache', date: '1 hr ago', icon: <Layers className="w-4 h-4 text-blue-400" />, status: 'Offline Mode' }
      ]
    },
    organization: {
      badge: 'Relational File Integrity',
      title: 'Streamlined Organization Suite',
      description: 'Stop sifting through chaotic folder structures. Cyberspace introduces intelligent taxonomic search, unified file sorting tags, and complete historical version timelines for every file group in your vault.',
      bullets: [
        'Dual-indexed taxonomies with smart tagging hierarchies',
        'Historical draft version timelines with one-click restore states',
        'Multi-format native visualizer supporting instant safe previews'
      ],
      mockupTitle: 'Logical Metadata & Taxonomy Hub',
      mockupStatus: 'Indexed & Organized',
      mockupStatusColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      files: [
        { name: 'GDPR_Compliance_Audit_2026.pdf', meta: 'Tag: #Compliance #Legal', date: '10 min ago', icon: <Tag className="w-4 h-4 text-sky-400" />, status: 'Categorized' },
        { name: 'Contract_Standard_Agreement_final.pdf', meta: 'V3.2 (Active State)', date: '3 hrs ago', icon: <FileCheck className="w-4 h-4 text-teal-400" />, status: 'V3.2 Stable' },
        { name: 'Enterprise_Deployment_Config.json', meta: 'Tag: #Devops #Confidential', date: 'Yesterday', icon: <FileCode className="w-4 h-4 text-purple-400" />, status: 'Indexed' }
      ]
    }
  };

  const selectedBenefit = benefitDetails[activeTab];

  return (
    <section id="proposition" className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden border-y border-slate-200">
      {/* Decorative Grid Line Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-80" />
      
      {/* Dynamic Glowing Background Blob */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Block with Value Proposition */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest leading-none">Unified Vault Engine</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            The premium platform for <br />
            <span className="text-emerald-600">sensitive document management</span>
          </h2>
          
          <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed">
            Cyberspace matches impenetrable zero-trust storage protocols with highly integrated search indexing and high-speed delivery networks. Say goodbye to insecure email drafts, risky file attachments, and disorganized shared volumes.
          </p>
        </div>

        {/* Multi-Tab Interactive Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Interactive Left Segment: Benefit Toggles */}
          <div className="lg:col-span-6 space-y-8">
            <div className="flex flex-col gap-3">
              
              {/* Tab 1: Enhanced Security */}
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative group flex gap-4 ${
                  activeTab === 'security' 
                    ? 'bg-white border-emerald-200 shadow-md ring-1 ring-emerald-500/5' 
                    : 'bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white/80'
                }`}
              >
                <div className={`p-3 rounded-xl border flex-shrink-0 transition-all duration-300 ${
                  activeTab === 'security'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100'
                }`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg mb-1 flex items-center gap-2">
                    Enhanced Security
                    {activeTab === 'security' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Zero-knowledge end-to-end client cryptographic protocols keeping your highly critical files sealed.
                  </p>
                </div>
              </button>

              {/* Tab 2: Easy Access */}
              <button 
                onClick={() => setActiveTab('access')}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative group flex gap-4 ${
                  activeTab === 'access' 
                    ? 'bg-white border-emerald-200 shadow-md ring-1 ring-emerald-500/5' 
                    : 'bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white/80'
                }`}
              >
                <div className={`p-3 rounded-xl border flex-shrink-0 transition-all duration-300 ${
                  activeTab === 'access'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100'
                }`}>
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg mb-1 flex items-center gap-2">
                    Easy Access
                    {activeTab === 'access' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Instant cross-device retrieval and secure tokenless link deliveries with expiry safeguards.
                  </p>
                </div>
              </button>

              {/* Tab 3: Streamlined Organization */}
              <button 
                onClick={() => setActiveTab('organization')}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative group flex gap-4 ${
                  activeTab === 'organization' 
                    ? 'bg-white border-emerald-200 shadow-md ring-1 ring-emerald-500/5' 
                    : 'bg-white/40 border-slate-100 hover:border-slate-300 hover:bg-white/80'
                }`}
              >
                <div className={`p-3 rounded-xl border flex-shrink-0 transition-all duration-300 ${
                  activeTab === 'organization'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100'
                }`}>
                  <FolderLock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg mb-1 flex items-center gap-2">
                    Streamlined Organization
                    {activeTab === 'organization' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Tag-centric file groupings, duplicate protection layers, and automated document version timeline charts.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Right Segment: Sleek Live App Mockup Window & Feature Text details */}
          <div className="lg:col-span-6 bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.6)] relative flex flex-col justify-between overflow-hidden min-h-[500px]">
            {/* Absolute vector lines inside mockup background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
            
            {/* Mock Windows Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-[11px] font-mono text-slate-500 ml-3 tracking-wide">cyberspace-client-v2.8</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold font-mono tracking-wider uppercase ${selectedBenefit.mockupStatusColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {selectedBenefit.mockupStatus}
              </div>
            </div>

            {/* Dynamic Content Details Block */}
            <div className="relative z-10 flex-grow mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-500 uppercase">{selectedBenefit.badge}</span>
              </div>
              <h4 className="text-xl lg:text-2xl font-bold text-white mb-3">
                {selectedBenefit.title}
              </h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                {selectedBenefit.description}
              </p>

              {/* Bullet Features (Sleek List) */}
              <ul className="space-y-2.5 mb-8">
                {selectedBenefit.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold leading-normal">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* Live Simulated Files View */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search vault assets...</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">3 Matches</span>
                </div>

                <div className="space-y-2">
                  {selectedBenefit.files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-800 duration-200 group/file">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {file.icon}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-200 truncate group-hover/file:text-emerald-400 transition-colors">{file.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{file.meta}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">{file.date}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold font-mono">
                          {file.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom mini-trigger button inside mock UI to interact with main auth modals */}
            <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-5 text-xs text-slate-400 font-mono">
              <span>Security level: E2EE-High-Grade</span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                Zero-Knowledge Proofs Verified
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ValueProposition;
