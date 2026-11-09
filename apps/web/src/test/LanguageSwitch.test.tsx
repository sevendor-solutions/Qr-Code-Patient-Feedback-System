import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import i18n from '../i18n';

describe('Multilingual i18n Internationalization', () => {
  it('translates feedback text into English by default', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('giveReview')).toBe('Give Review & Rating');
    expect(i18n.t('raiseComplaint')).toBe('Raise Query / Complaint');
  });

  it('translates feedback text into Telugu (తెలుగు)', () => {
    i18n.changeLanguage('te');
    expect(i18n.t('giveReview')).toBe('సమీక్ష & రేటింగ్ ఇవ్వండి');
    expect(i18n.t('raiseComplaint')).toBe('ఫిర్యాదు / ప్రశ్న నమోదు చేయండి');
  });

  it('translates feedback text into Hindi (हिंदी)', () => {
    i18n.changeLanguage('hi');
    expect(i18n.t('giveReview')).toBe('समीक्षा और रेटिंग दें');
    expect(i18n.t('raiseComplaint')).toBe('शिकायत / पूछताछ दर्ज करें');
  });
});
