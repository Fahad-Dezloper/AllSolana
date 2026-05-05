import React from 'react'
import Image from 'next/image'
import { Star, Code2 } from 'lucide-react'

const OGPage = () => {
  return (
    <div className="w-[1200px] h-[630px] bg-[#000] flex flex-col p-20 relative overflow-hidden font-sans">
      {/* Background Accents */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#9945FF]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#14F195]/10 rounded-full blur-[120px]" />
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div className="flex items-center gap-1 mb-auto relative z-10">
        <div className="w-8 h-6">
          <Image 
            src="/logo/solanaLogoMark.svg" 
            width={48} 
            height={40} 
            className="w-full h-full object-contain" 
            alt="Solana Logo" 
          />
        </div>
        {/* <div className="h-8 w-px bg-white/20 mx-2" /> */}
        <span className="text-3xl font-bold text-white  uppercase">Contribute</span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mb-12">
        <h1 className="text-[120px] font-black text-white leading-[0.85] tracking-tighter uppercase mb-6">
          The Solana <br />
          <span className="text-[#14F195]">Open Source</span> <br />
          Index
        </h1>
        <p className="text-4xl text-neutral-400 font-medium tracking-tight max-w-4xl leading-relaxed">
          High-density index of active repositories on Solana
        </p>
      </div>

      {/* Brutalist Border */}
      <div className="absolute inset-0 border-[24px] border-white/5 pointer-events-none" />
      <div className="absolute bottom-12 right-12">
        <div className="px-6 py-3 bg-[#14F195] text-black text-xl font-black uppercase tracking-tighter transform rotate-[-2deg]">
          contribute.superteam
        </div>
      </div>
    </div>
  )
}

export default OGPage