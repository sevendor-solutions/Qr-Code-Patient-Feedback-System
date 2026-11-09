import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MainNav } from '../components/layout/MainNav';
import { SubMenuBar } from '../components/layout/SubMenuBar';

describe('Admin Navigation & Role Menus', () => {
  it('renders MainNav with Feedback module and hospital departments', () => {
    render(
      <BrowserRouter>
        <MainNav />
      </BrowserRouter>,
    );

    expect(screen.getByText('Feedback & Grievances')).toBeInTheDocument();
    expect(screen.getByText('OPD')).toBeInTheDocument();
    expect(screen.getByText('IPD')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
  });

  it('renders SubMenuBar with all module sub-items', () => {
    render(
      <BrowserRouter>
        <SubMenuBar />
      </BrowserRouter>,
    );

    expect(screen.getByText('Feedback Overview')).toBeInTheDocument();
    expect(screen.getByText('Generate QR Code')).toBeInTheDocument();
    expect(screen.getByText('Bulk QR Print (A4)')).toBeInTheDocument();
    expect(screen.getByText('Feedback Listing')).toBeInTheDocument();
    expect(screen.getByText('Query & Complaint Management')).toBeInTheDocument();
    expect(screen.getByText('Setup Masters')).toBeInTheDocument();
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });
});
