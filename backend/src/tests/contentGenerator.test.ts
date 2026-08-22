import { describe, expect, it } from 'vitest';
import { generateDynamicModuleContent } from '../services/contentGenerator.js';
import { LearningNode, UserNodeState } from '../types.js';

const mockNode: LearningNode = {
  id: 'LA-101',
  code: 'LA-101',
  title: 'Intake & KYC Operations',
  description: 'Master policy application processing and KYC checks.',
  category: '1. New Business & Underwriting',
  estimatedMinutes: 20,
  difficulty: 'beginner',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Know_your_customer',
  wikipediaSummary: 'Know your customer (KYC) guidelines require verifying identity...',
};

describe('Dynamic Content Generator Engine for L&A Insurance', () => {
  it('generates standard dynamic content and quiz question for L&A operations', () => {
    const content = generateDynamicModuleContent(mockNode);
    expect(content.nodeId).toBe(mockNode.id);
    expect(content.adaptiveContext).toBe('standard');
    expect(content.quiz.options.length).toBe(3);
    expect(content.quiz.question).toContain('Intake & KYC');
  });

  it('generates adaptive remediation content when user is in remediation state', () => {
    const remediationState: UserNodeState = {
      userId: 'user-1',
      nodeId: 'LA-101',
      status: 'remediation',
      highestQuizScore: 40,
      totalTimeSeconds: 500,
      confidenceLevel: 2,
      attemptsCount: 2,
      remediationCount: 1,
      updatedAt: new Date().toISOString(),
    };

    const content = generateDynamicModuleContent(mockNode, remediationState);
    expect(content.adaptiveContext).toBe('remediation');
    expect(content.overview).toContain('[Remediation Review]');
    expect(content.quiz.id).toBe('quiz-LA-101-rem');
  });

  it('generates adaptive reinforcement content when user is in reinforcement state', () => {
    const reinforcementState: UserNodeState = {
      userId: 'user-1',
      nodeId: 'LA-101',
      status: 'reinforcement',
      highestQuizScore: 90,
      totalTimeSeconds: 600,
      confidenceLevel: 1,
      attemptsCount: 1,
      remediationCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const content = generateDynamicModuleContent(mockNode, reinforcementState);
    expect(content.adaptiveContext).toBe('reinforcement');
    expect(content.overview).toContain('[Lateral Reinforcement]');
    expect(content.quiz.id).toBe('quiz-LA-101-reinf');
  });
});
