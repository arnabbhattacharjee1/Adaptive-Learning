import React, { useEffect, useRef, useState } from 'react';
import { LearningNode, RoutingDecision, TelemetrySignal, UserNodeState } from '../types';
import { evaluateRouting, fetchDynamicNodeContent, sendTelemetry } from '../services/api';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Clock, ExternalLink, FastForward, HelpCircle, Lightbulb, RefreshCw, Sparkles, XCircle, Zap } from 'lucide-react';

interface ModulePlayerProps {
  node: LearningNode;
  userId: string;
  userState?: UserNodeState;
  onDecisionTriggered: (decision: RoutingDecision) => void;
  onAnnounce: (msg: string) => void;
}

export const ModulePlayer: React.FC<ModulePlayerProps> = ({
  node,
  userId,
  userState,
  onDecisionTriggered,
  onAnnounce,
}) => {
  const [timeOnTaskSeconds, setTimeOnTaskSeconds] = useState(userState?.totalTimeSeconds || 0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [latestDecision, setLatestDecision] = useState<RoutingDecision | null>(null);
  const [dynamicData, setDynamicData] = useState<any>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Load dynamic content generated on-the-fly
  useEffect(() => {
    fetchDynamicNodeContent(node.id, userId)
      .then((data) => setDynamicData(data.dynamicContent))
      .catch((err) => console.error('Failed to load dynamic content:', err));
  }, [node.id, userId, userState?.status]);

  // Non-blocking telemetry heartbeat (every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnTaskSeconds((prev) => {
        const nextTime = prev + 15;
        sendTelemetry({
          userId,
          nodeId: node.id,
          eventType: 'heartbeat',
          timeOnTaskSeconds: nextTime,
        }).catch((err) => console.error('Heartbeat telemetry error:', err));
        return nextTime;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [node.id, userId]);

  useEffect(() => {
    setSelectedAnswer(null);
    setConfidenceLevel(3);
    setQuizSubmitted(false);
    setLatestDecision(null);
  }, [node.id]);

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const signal: TelemetrySignal = {
        userId,
        nodeId: node.id,
        eventType: 'skip',
        skipsCount: 1,
        quizScore: 90,
        timeOnTaskSeconds,
      };

      await sendTelemetry(signal);
      const res = await evaluateRouting(node.id, signal);
      setLatestDecision(res.decision);
      onDecisionTriggered(res.decision);
      onAnnounce(`Fast-track skip registered. Action: ${res.decision.action}. ${res.decision.reason}`);
      bannerRef.current?.focus();
    } catch (err) {
      console.error('Skip error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswer === null || !dynamicData?.quiz) return;

    setIsSubmitting(true);
    setQuizSubmitted(true);

    try {
      const isCorrect = dynamicData.quiz.options[selectedAnswer]?.isCorrect;
      const quizScore = isCorrect ? 85 : 40;

      const signal: TelemetrySignal = {
        userId,
        nodeId: node.id,
        eventType: 'quiz_submit',
        quizScore,
        confidenceLevel,
        timeOnTaskSeconds,
      };

      await sendTelemetry(signal);
      const res = await evaluateRouting(node.id, signal);
      setLatestDecision(res.decision);
      onDecisionTriggered(res.decision);
      onAnnounce(`Quiz submitted (${isCorrect ? 'Correct' : 'Incorrect'}). Routing Action: ${res.decision.action}. ${res.decision.reason}`);
      bannerRef.current?.focus();
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuiz = dynamicData?.quiz;
  const isSelectedCorrect = selectedAnswer !== null && currentQuiz?.options[selectedAnswer]?.isCorrect;

  return (
    <article className="bg-white border border-google-border rounded-2xl p-6 shadow-sm space-y-6" aria-labelledby="module-heading">
      {/* Header Info & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-google-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-google-blue bg-google-blue-light px-2.5 py-0.5 rounded border border-google-blue/30">
              {node.code}
            </span>
            <span className="text-xs text-google-secondary font-medium">Category: {node.category}</span>
            {dynamicData?.adaptiveContext && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                dynamicData.adaptiveContext === 'remediation'
                  ? 'bg-google-red-light text-[#C5221F]'
                  : dynamicData.adaptiveContext === 'reinforcement'
                  ? 'bg-google-yellow-light text-[#B06000]'
                  : 'bg-google-green-light text-[#137333]'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>Dynamic Mode: {dynamicData.adaptiveContext}</span>
              </span>
            )}
          </div>
          <h2 id="module-heading" className="text-2xl font-bold text-google-text">
            {node.title}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-google-secondary bg-google-bg-off px-3 py-1.5 rounded-xl border border-google-border font-medium">
            <Clock className="w-4 h-4 text-google-blue" aria-hidden="true" />
            <span>Time on Task: {Math.floor(timeOnTaskSeconds / 60)}m {timeOnTaskSeconds % 60}s</span>
          </div>

          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 text-xs bg-google-bg-off hover:bg-google-blue-light text-google-blue border border-google-blue/30 px-3.5 py-2 rounded-xl font-bold transition"
            aria-label="Skip module via fast-track assessment"
          >
            <FastForward className="w-4 h-4 text-google-blue" aria-hidden="true" />
            <span>Fast-Track / Skip</span>
          </button>
        </div>
      </div>

      {/* Dynamically Generated Learning Objectives */}
      <div className="bg-google-bg-off rounded-xl p-5 border border-google-border text-google-text text-sm leading-relaxed space-y-4">
        <h3 className="text-xs uppercase tracking-wider font-bold text-google-blue flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4" aria-hidden="true" /> Dynamically Generated Learning Objectives
        </h3>
        <p className="text-google-text font-medium">{dynamicData?.overview || node.description}</p>

        {dynamicData?.keyTakeaways && (
          <ul className="space-y-1.5 text-xs text-google-secondary font-medium">
            {dynamicData.keyTakeaways.map((takeaway: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-google-blue mt-1.5"></span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Wikipedia Grounded Reference Box */}
        {node.wikipediaUrl && (
          <div className="bg-white p-4 rounded-xl border border-google-border space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-google-text flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-google-blue" aria-hidden="true" />
                Wikipedia Grounded Reference
              </span>
              <a
                href={node.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-google-blue hover:text-google-blue-hover font-bold flex items-center gap-1 hover:underline"
              >
                <span>Read on Wikipedia</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
            <blockquote className="text-xs text-google-secondary italic border-l-2 border-google-blue pl-3 py-1 bg-google-bg-off/60 rounded-r-lg leading-relaxed">
              "{node.wikipediaSummary}"
            </blockquote>
            <p className="text-[10px] text-google-secondary font-mono">
              Grounding Source: <span className="font-semibold text-google-text">{node.wikipediaUrl}</span>
            </p>
          </div>
        )}
      </div>

      {/* Dynamically Generated Quiz Form */}
      <form onSubmit={handleSubmitQuiz} className="bg-google-bg-off rounded-xl border border-google-border p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-google-border pb-3">
          <h3 className="text-sm font-bold text-google-text flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-google-blue" aria-hidden="true" /> Dynamically Generated Adaptive Quiz
          </h3>
          <span className="text-xs text-google-secondary font-medium">Single Choice + Confidence Metric</span>
        </div>

        {currentQuiz ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-google-text mb-2">
              {currentQuiz.question}
            </legend>

            <div className="space-y-2">
              {currentQuiz.options.map((opt: any) => {
                const isSelected = selectedAnswer === opt.id;
                const showCorrect = quizSubmitted && opt.isCorrect;
                const showIncorrect = quizSubmitted && isSelected && !opt.isCorrect;

                return (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                      showCorrect
                        ? 'bg-google-green-light border-google-green text-[#137333] font-bold shadow-sm'
                        : showIncorrect
                        ? 'bg-google-red-light border-google-red text-[#C5221F] font-bold shadow-sm'
                        : isSelected
                        ? 'bg-white border-google-blue text-google-text ring-2 ring-google-blue/30 shadow-sm'
                        : 'bg-white hover:bg-google-blue-light/20 border-google-border text-google-secondary'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="quiz-answer"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => !quizSubmitted && setSelectedAnswer(opt.id)}
                        disabled={quizSubmitted}
                        className="w-4 h-4 text-google-blue bg-white border-google-border focus:ring-google-blue"
                      />
                      <span className="text-xs font-medium">{opt.text}</span>
                    </div>

                    {quizSubmitted && (
                      <div className="flex items-center space-x-1.5 text-xs font-bold">
                        {opt.isCorrect && (
                          <span className="flex items-center gap-1 text-[#137333]">
                            <CheckCircle2 className="w-4 h-4 text-google-green" />
                            <span>Correct Answer</span>
                          </span>
                        )}
                        {showIncorrect && (
                          <span className="flex items-center gap-1 text-[#C5221F]">
                            <XCircle className="w-4 h-4 text-google-red" />
                            <span>Incorrect Choice</span>
                          </span>
                        )}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="text-xs text-google-secondary">Generating adaptive quiz questions...</p>
        )}

        {/* Detailed Explanation Feedback Box upon Quiz Submission */}
        {quizSubmitted && currentQuiz?.explanation && (
          <div
            className={`p-4 rounded-xl border space-y-1 text-xs leading-relaxed ${
              isSelectedCorrect
                ? 'bg-google-green-light border-google-green/60 text-[#137333]'
                : 'bg-google-red-light border-google-red/60 text-[#C5221F]'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold">
              {isSelectedCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-google-green" />
                  <span>Correct! Operational Rationale:</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-google-red" />
                  <span>Incorrect. Operational Rationale & Statutory Rule:</span>
                </>
              )}
            </div>
            <p className="font-medium opacity-95">{currentQuiz.explanation}</p>
          </div>
        )}

        {/* Self-Reported Confidence Rating (1-5 Scale) */}
        <div className="bg-white p-4 rounded-xl border border-google-border space-y-2 shadow-sm">
          <label htmlFor="confidence-slider" className="block text-xs font-bold text-google-text flex items-center justify-between">
            <span>Self-Reported Confidence Rating (1 = Uncertain, 5 = Very Confident):</span>
            <span className="text-google-blue font-mono font-bold text-sm bg-google-blue-light px-2.5 py-0.5 rounded-full border border-google-blue/30">
              {confidenceLevel} / 5
            </span>
          </label>
          <input
            id="confidence-slider"
            type="range"
            min="1"
            max="5"
            step="1"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="w-full h-2 bg-google-border rounded-lg appearance-none cursor-pointer accent-google-blue"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={confidenceLevel}
            aria-valuetext={`Confidence level ${confidenceLevel} out of 5`}
          />
        </div>

        <button
          type="submit"
          disabled={selectedAnswer === null || isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 ${
            selectedAnswer === null || isSubmitting
              ? 'bg-google-border text-google-secondary cursor-not-allowed'
              : 'bg-google-blue hover:bg-google-blue-hover text-white shadow-sm cursor-pointer'
          }`}
        >
          <span>{quizSubmitted ? 'Re-Evaluate Assessment & Update Telemetry' : 'Submit Assessment & Trigger Telemetry'}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      {/* Real-time Routing Engine Decision Banner */}
      {latestDecision && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          aria-live="polite"
          className={`p-5 rounded-2xl border space-y-2 transition-all focus:outline-none focus:ring-2 ${
            latestDecision.action === 'FAST_TRACK' || latestDecision.action === 'STANDARD_PROGRESSION'
              ? 'bg-google-green-light border-google-green text-[#137333]'
              : latestDecision.action === 'REMEDIATION' || latestDecision.action === 'CALIBRATION_DROP'
              ? 'bg-google-red-light border-google-red text-[#C5221F]'
              : 'bg-google-yellow-light border-google-yellow text-[#B06000]'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold text-sm">
            {latestDecision.action === 'FAST_TRACK' && <Zap className="w-5 h-5 text-[#137333]" aria-hidden="true" />}
            {latestDecision.action === 'REMEDIATION' && <AlertCircle className="w-5 h-5 text-[#C5221F]" aria-hidden="true" />}
            {latestDecision.action === 'LATERAL_REINFORCEMENT' && <RefreshCw className="w-5 h-5 text-[#B06000]" aria-hidden="true" />}
            {latestDecision.action === 'CALIBRATION_DROP' && <AlertCircle className="w-5 h-5 text-[#C5221F]" aria-hidden="true" />}
            {latestDecision.action === 'STANDARD_PROGRESSION' && <CheckCircle2 className="w-5 h-5 text-[#137333]" aria-hidden="true" />}
            <span>Routing Action: {latestDecision.action}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90 font-medium">{latestDecision.reason}</p>
        </div>
      )}
    </article>
  );
};
