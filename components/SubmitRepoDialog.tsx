"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Code2,
  Globe,
} from "lucide-react";

const GithubIcon = ({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
  </svg>
);

interface SubmitRepoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingRepos: string[];
}

type StepStatus = "idle" | "loading" | "complete" | "error";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: any;
  status: StepStatus;
}

export function SubmitRepoDialog({
  isOpen,
  onClose,
  existingRepos,
}: SubmitRepoDialogProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<any>(null);
  const [contributorUsername, setContributorUsername] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContributorInput, setShowContributorInput] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    {
      id: "duplicate",
      label: "DUPLICATE CHECK",
      description: "Verifying if repo is already indexed",
      icon: Globe,
      status: "idle",
    },
    {
      id: "fetch",
      label: "FETCHING DATA",
      description: "Retrieving repository metadata",
      icon: GithubIcon,
      status: "idle",
    },
    {
      id: "activity",
      label: "ACTIVITY AUDIT",
      description: "Checking for commits in last 2 months",
      icon: Loader2,
      status: "idle",
    },
    {
      id: "quality",
      label: "OPEN SOURCE AUDIT",
      description: "Verifying documentation & guidelines",
      icon: Code2,
      status: "idle",
    },
    {
      id: "solana",
      label: "SOLANA CHECK",
      description: "Verifying ecosystem alignment",
      icon: Cpu,
      status: "idle",
    },
    {
      id: "final",
      label: "ELIGIBILITY",
      description: "Final verification result",
      icon: ShieldCheck,
      status: "idle",
    },
  ]);

  const resetSteps = () => {
    setSteps((s) => s.map((step) => ({ ...step, status: "idle" })));
    setCurrentStep(0);
    setIsVerifying(false);
    setErrorReason(null);
    setRepoData(null);
    setContributorUsername("");
    setIsVerified(false);
    setIsSubmitting(false);
    setShowContributorInput(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setRepoUrl("");
      resetSteps();
    }, 300);
  };

  const startVerification = async () => {
    if (!repoUrl.includes("github.com/")) return;

    // Extract owner/repo
    const parts = repoUrl.split("github.com/")[1]?.split("/");
    if (!parts || parts.length < 2) return;
    const fullName = `${parts[0]}/${parts[1]}`.toLowerCase();

    setIsVerifying(true);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "loading" } : s)),
      );

      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));

      // Step Specific Logic
      const stepId = steps[i].id;
      let isSuccess = true;
      let failureReason = "";

      try {
        if (stepId === "duplicate") {
          if (existingRepos.some((r) => r.toLowerCase() === fullName)) {
            isSuccess = false;
            failureReason = "REPOSITORY ALREADY EXISTS IN OUR INDEX";
          }
        } else if (stepId === "fetch" || stepId === "activity") {
          const res = await fetch(`https://api.github.com/repos/${fullName}`);
          if (!res.ok) {
            isSuccess = false;
            failureReason = res.status === 404 ? "REPOSITORY NOT FOUND" : "GITHUB API ERROR";
          } else {
            const data = await res.json();
            setRepoData(data);
            
            if (stepId === "activity") {
              const lastPush = new Date(data.pushed_at);
              const twoMonthsAgo = new Date();
              twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
              
              if (lastPush < twoMonthsAgo) {
                isSuccess = false;
                failureReason = "NO COMMITS IN THE LAST 2 MONTHS (STALE)";
              }
            }
          }
        } else if (stepId === "quality") {
          // Real check: Fetch README and scan for keywords
          const res = await fetch(`https://api.github.com/repos/${fullName}/readme`);
          if (!res.ok) {
            isSuccess = false;
            failureReason = "MISSING README.MD (DOCUMENTATION REQUIRED)";
          } else {
            const data = await res.json();
            const content = atob(data.content).toLowerCase();
            const hasSetup = content.includes("setup") || content.includes("install") || content.includes("getting started");
            const hasGuidelines = content.includes("contribut") || content.includes("guidelines") || content.includes("pr welcome");
            
            if (!hasSetup && !hasGuidelines) {
              isSuccess = false;
              failureReason = "README MISSING SETUP OR CONTRIBUTION GUIDELINES";
            }
          }
        } else if (stepId === "solana") {
          // Real check: Check topics and files
          const [repoRes, contentsRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${fullName}`),
            fetch(`https://api.github.com/repos/${fullName}/contents`)
          ]);
          
          const repoData = await repoRes.json();
          const contents = contentsRes.ok ? await contentsRes.json() : [];
          
          const hasSolanaTopic = repoData.topics?.some((t: string) => 
            ["solana", "anchor", "blockchain", "web3", "crypto"].includes(t.toLowerCase())
          );
          
          const hasSolanaFiles = contents.some((f: any) => 
            ["Anchor.toml", "Cargo.toml", "solana", "program"].some(name => f.name.toLowerCase().includes(name))
          );

          if (!hasSolanaTopic && !hasSolanaFiles) {
            isSuccess = false;
            failureReason = "NOT A SOLANA REPOSITORY (ECOSYSTEM MISMATCH)";
          }
        }
      } catch (err) {
        isSuccess = false;
        failureReason = "CONNECTION ERROR OR RATE LIMIT REACHED";
      }

      if (!isSuccess) {
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "error" } : s)),
        );
        setErrorReason(failureReason);
        return;
      }

      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "complete" } : s)),
      );
    }
    
    setIsVerified(true);
    // After a short delay, show the contributor input
    setTimeout(() => setShowContributorInput(true), 1500);
  };

  const submitFinal = async () => {
    if (!contributorUsername) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: repoData.full_name,
          ownerLogin: repoData.owner.login,
          summary: repoData.description,
          submittedBy: contributorUsername,
        }),
      });
      
      if (res.ok) {
        setIsVerifying(false); // Done
        // Wait a bit then close or show final success
        setTimeout(() => handleClose(), 2000);
      } else {
        const error = await res.json();
        setErrorReason(error.error || "FAILED TO SUBMIT TO DATABASE");
      }
    } catch (err) {
      setErrorReason("NETWORK ERROR DURING SUBMISSION");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0A0A0A] border border-neutral-800 p-8 z-[101] rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase text-white mb-2">
                  {showContributorInput ? "Who are you?" : "Submit Repository"}
                </h2>
                <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">
                  {showContributorInput ? "Tag yourself as the contributor" : "Verify your project for the index"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            {!isVerifying ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
                    GitHub URL
                  </label>
                  <div className="relative group">
                    <GithubIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="https://github.com/org/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={startVerification}
                  disabled={!repoUrl.includes("github.com/")}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-2"
                >
                  Start Verification <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === currentStep;
                  const isDone =
                    idx < currentStep ||
                    (idx === steps.length - 1 && step.status === "complete");
                  const isError = step.status === "error";

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                        isActive
                          ? "bg-neutral-900 border-neutral-700"
                          : isError
                            ? "bg-red-500/5 border-red-500/20"
                            : "border-transparent"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-white text-black"
                            : isError
                              ? "bg-red-500 text-white"
                              : isActive
                                ? "bg-neutral-800 text-white"
                                : "bg-neutral-900 text-neutral-600"
                        }`}
                      >
                        {step.status === "loading" ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : isDone ? (
                          <Check size={18} strokeWidth={3} />
                        ) : isError ? (
                          <X size={18} strokeWidth={3} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-[11px] font-black tracking-widest uppercase ${
                              isDone
                                ? "text-white"
                                : isError
                                  ? "text-red-500"
                                  : isActive
                                    ? "text-white"
                                    : "text-neutral-600"
                            }`}
                          >
                            {step.label}
                          </h3>
                          {step.status === "loading" && (
                            <span className="text-[10px] font-bold text-neutral-500 animate-pulse">
                              PROCESSING...
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] font-bold mt-0.5 ${
                            isActive
                              ? "text-neutral-400"
                              : isError
                                ? "text-red-400/60"
                                : "text-neutral-700"
                          }`}
                        >
                          {isError ? errorReason : step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {isVerified && showContributorInput && !isSubmitting && !errorReason && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 pt-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
                        Contributor GitHub Username
                      </label>
                      <div className="relative group">
                        <GithubIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="e.g. dezloper"
                          value={contributorUsername}
                          onChange={(e) => setContributorUsername(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/20 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      onClick={submitFinal}
                      disabled={!contributorUsername}
                      className="w-full bg-solana-green text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-solana-green/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Complete Submission"}
                    </button>
                  </motion.div>
                )}

                {isVerified && !showContributorInput && !errorReason && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <div className="bg-solana-green/10 border border-solana-green/20 p-6 rounded-3xl flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 bg-solana-green rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(20,241,149,0.3)]">
                        <Check size={32} className="text-black" strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl">Verification Passed</h3>
                        <p className="text-solana-green/60 text-[10px] font-bold uppercase tracking-widest mt-1">Preparing final steps...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {errorReason && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-4">
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                        {errorReason}
                      </p>
                    </div>
                    <button
                      onClick={resetSteps}
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all"
                    >
                      Try Another Repository
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
