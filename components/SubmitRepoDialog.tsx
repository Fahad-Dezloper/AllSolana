"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
  ExternalLink,
  User,
  Search,
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContributorInput, setShowContributorInput] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    {
      id: "duplicate",
      label: "REGISTRY AUDIT",
      description: "Checking if repository is already indexed",
      icon: Globe,
      status: "idle",
    },
    {
      id: "fetch",
      label: "METADATA SYNC",
      description: "Retrieving repository core metadata",
      icon: GithubIcon,
      status: "idle",
    },
    {
      id: "activity",
      label: "LIVENESS AUDIT",
      description: "Verifying commits within 60-day window",
      icon: Loader2,
      status: "idle",
    },
    {
      id: "quality",
      label: "QUALITY GATE",
      description: "Validating documentation & guidelines",
      icon: Code2,
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
    setSuggestions([]);
    setSelectedUser(null);
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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (contributorUsername.length < 2 || selectedUser) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://api.github.com/search/users?q=${contributorUsername}&per_page=5`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [contributorUsername, selectedUser]);

  const startVerification = async () => {
    if (!repoUrl.includes("github.com/")) return;

    const parts = repoUrl.split("github.com/")[1]?.split("/");
    if (!parts || parts.length < 2) return;

    // Clean up the repo name: remove .git suffix and any trailing slashes
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "").replace(/\/$/, "");
    const fullName = `${owner}/${repo}`.toLowerCase();

    setIsVerifying(true);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "loading" } : s)),
      );

      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));

      const stepId = steps[i].id;
      let isSuccess = true;
      let failureReason = "";

      try {
        if (stepId === "duplicate") {
          const checkRes = await fetch(`/api/check-repo?fullName=${fullName}`);
          if (checkRes.ok) {
            const { exists } = await checkRes.json();
            if (exists) {
              isSuccess = false;
              failureReason = "REPOSITORY ALREADY INDEXED IN REGISTRY";
            }
          }
        } else if (stepId === "fetch" || stepId === "activity") {
          const res = await fetch(`https://api.github.com/repos/${fullName}`);
          if (!res.ok) {
            isSuccess = false;
            failureReason =
              res.status === 404 ? "REPOSITORY NOT FOUND" : "GITHUB API ERROR";
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
          const res = await fetch(
            `https://api.github.com/repos/${fullName}/readme`,
          );
          if (!res.ok) {
            isSuccess = false;
            failureReason = "MISSING README.MD (DOCUMENTATION REQUIRED)";
          } else {
            const data = await res.json();
            const content = atob(data.content).toLowerCase();
            const hasSetup =
              content.includes("setup") ||
              content.includes("install") ||
              content.includes("getting started");
            const hasGuidelines =
              content.includes("contribut") ||
              content.includes("guidelines") ||
              content.includes("pr welcome");

            if (!hasSetup && !hasGuidelines) {
              isSuccess = false;
              failureReason = "README MISSING SETUP OR CONTRIBUTION GUIDELINES";
            }
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
    await submitFinal(contributorUsername, false); // Automatic background save
  };

  const [isAttributed, setIsAttributed] = useState(false);

  const submitFinal = async (
    usernameOverride?: string,
    isManual: boolean = true,
  ) => {
    setIsSubmitting(true);
    try {
      const parts = repoUrl.split("github.com/")[1]?.split("/");
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, "").replace(/\/$/, "");
      const fullName = `${owner}/${repo}`.toLowerCase();

      // Use actual repo data description instead of the step description placeholder
      const summary = repoData?.description || "";

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          ownerLogin: repoData?.owner?.login || parts[0],
          summary,
          submittedBy:
            selectedUser?.login ||
            usernameOverride ||
            contributorUsername ||
            null,
        }),
      });

      if (res.ok) {
        setIsSubmitting(false);
        if (isManual) {
          setIsAttributed(true);
          setTimeout(() => handleClose(), 1500);
        }
      } else {
        const error = await res.json();
        setErrorReason(error.error || "Failed to save project");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorReason("Network error during final submission");
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0A0A] border border-neutral-800 p-6 z-[101] rounded-md shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase text-white mb-1">
                  Submit Repository
                </h2>
                <p className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase">
                  Audit project for quality and alignment
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-neutral-800 rounded-md transition-colors"
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
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={startVerification}
                  disabled={!repoUrl.includes("github.com/")}
                  className="w-full bg-white text-black py-4 rounded-md font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center gap-2"
                >
                  Start Verification <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status/Focus Card */}
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-md shadow-2xl relative overflow-hidden group min-h-[160px] flex flex-col justify-center">
                  {isVerified ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center text-center gap-3"
                    >
                      <div className="w-12 h-12 bg-solana-green rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(20,241,149,0.3)]">
                        <Check
                          size={24}
                          className="text-black"
                          strokeWidth={3}
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-black uppercase tracking-tighter text-lg">
                          {isAttributed
                            ? "Attribution Saved"
                            : "Audit Complete"}
                        </h3>
                        <p className="text-solana-green/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                          {isAttributed
                            ? "Thank you for contributing!"
                            : "Registry Updated Successfully"}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {React.createElement(steps[currentStep].icon, {
                          size: 64,
                          className: "text-white",
                        })}
                      </div>

                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                          {steps[currentStep].status === "loading" ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            React.createElement(steps[currentStep].icon, {
                              size: 20,
                            })
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-solana-green uppercase tracking-[0.2em]">
                            Step {currentStep + 1} of {steps.length}
                          </p>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {steps[currentStep].label}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-white leading-relaxed relative z-10">
                        {errorReason ? (
                          <span className="text-red-500 font-black">
                            {errorReason}
                          </span>
                        ) : (
                          steps[currentStep].description
                        )}
                      </p>

                      <div className="flex gap-1.5 mt-6 relative z-10">
                        {steps.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-md transition-all duration-500 ${
                              i === currentStep
                                ? "w-8 bg-white"
                                : i < currentStep
                                  ? "w-4 bg-solana-green"
                                  : "w-2 bg-neutral-800"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Contributor Section */}
                {!errorReason && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
                        Tag Yourself{" "}
                        <span className="opacity-50">(Optional)</span>
                      </label>
                      <div className="relative">
                        {selectedUser ? (
                          <div className="flex items-center justify-between w-full bg-neutral-900 border border-white/20 rounded-md py-2.5 pl-3 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={selectedUser.avatar_url}
                                alt={selectedUser.login}
                                className="w-8 h-8 rounded-full border border-neutral-700"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                  {selectedUser.login}
                                </span>
                                <a
                                  href={selectedUser.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-solana-green font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                                >
                                  View Profile <ExternalLink size={8} />
                                </a>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedUser(null);
                                setContributorUsername("");
                              }}
                              className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-white transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <GithubIcon
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600"
                                size={16}
                              />
                              <input
                                type="text"
                                placeholder="GitHub Username"
                                value={contributorUsername}
                                onChange={(e) =>
                                  setContributorUsername(e.target.value)
                                }
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-md py-3.5 pl-11 pr-4 text-xs font-bold text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/20 transition-all uppercase tracking-widest"
                              />
                              {isLoadingSuggestions && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  <Loader2
                                    size={14}
                                    className="animate-spin text-neutral-600"
                                  />
                                </div>
                              )}
                            </div>

                            <AnimatePresence>
                              {suggestions.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute left-0 right-0 top-full mt-2 bg-[#0A0A0A] border border-neutral-800 rounded-md overflow-hidden z-20 shadow-2xl"
                                >
                                  {suggestions.map((user) => (
                                    <button
                                      key={user.id}
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setContributorUsername(user.login);
                                        setSuggestions([]);
                                      }}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-neutral-900 transition-colors border-b border-neutral-800/50 last:border-0 group"
                                    >
                                      <img
                                        src={user.avatar_url}
                                        alt={user.login}
                                        className="w-6 h-6 rounded-full border border-neutral-800"
                                      />
                                      <span className="text-[11px] font-bold text-neutral-400 group-hover:text-white transition-colors">
                                        {user.login}
                                      </span>
                                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Check
                                          size={12}
                                          className="text-solana-green"
                                        />
                                      </div>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    </div>

                    {isVerified && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleClose}
                          className="flex-1 px-6 py-4 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-md font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => submitFinal()}
                          disabled={
                            (!contributorUsername && !selectedUser) ||
                            isSubmitting
                          }
                          className="flex-[2] px-6 py-4 bg-solana-green text-black rounded-md font-black text-xs uppercase tracking-widest hover:bg-solana-green/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Submit Attribution"
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {errorReason && (
                  <div className="pt-2">
                    <button
                      onClick={resetSteps}
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400 py-4 rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all"
                    >
                      Try Another Repository
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
