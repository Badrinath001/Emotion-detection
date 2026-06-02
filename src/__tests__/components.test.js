import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlowRing, EmotionBar, AlertItem, StatBadge } from '../emotion_dashboard';

describe('UI Components - GlowRing', () => {
  test('renders with percentage text', () => {
    render(<GlowRing pct={75} color="#FFD166" label="ACCURACY" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('renders label correctly', () => {
    render(<GlowRing pct={85} color="#06D6A0" label="F1 SCORE" />);
    expect(screen.getByText('F1 SCORE')).toBeInTheDocument();
  });

  test('renders optional sub-label when provided', () => {
    render(<GlowRing pct={90} color="#5E9AFF" label="TEST" sub="89%" />);
    expect(screen.getByText('89%')).toBeInTheDocument();
  });

  test('does not render sub-label when not provided', () => {
    const { container } = render(<GlowRing pct={80} color="#FFD166" label="LABEL" />);
    const subLabels = container.querySelectorAll('span:nth-of-type(3)');
    // Should have 2 spans: percentage and label, not a third for sub
    expect(container.querySelectorAll('span')).toHaveLength(2);
  });

  test('applies custom size to SVG', () => {
    const { container } = render(<GlowRing pct={70} color="#FF5757" label="METRIC" size={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  test('uses provided color in SVG element', () => {
    const { container } = render(<GlowRing pct={60} color="#FFD166" label="TEST" />);
    const circles = container.querySelectorAll('circle');
    // Second circle (the animated one) should have the color stroke
    expect(circles[1]).toHaveAttribute('stroke', '#FFD166');
  });
});

describe('UI Components - EmotionBar', () => {
  test('renders emotion name and icon', () => {
    render(<EmotionBar emotion="Happy" value={80} onClick={() => {}} selected={false} />);
    expect(screen.getByText(/Happy/)).toBeInTheDocument();
  });

  test('displays percentage value', () => {
    render(<EmotionBar emotion="Sad" value={45} onClick={() => {}} selected={false} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  test('calls onClick with emotion when clicked', () => {
    const onClick = jest.fn();
    const { container } = render(
      <EmotionBar emotion="Angry" value={30} onClick={onClick} selected={false} />
    );
    fireEvent.click(container.firstChild);
    expect(onClick).toHaveBeenCalledWith('Angry');
  });

  test('applies selected styling when selected', () => {
    const { container } = render(
      <EmotionBar emotion="Happy" value={85} onClick={() => {}} selected={true} />
    );
    const emotionDiv = container.firstChild;
    const style = emotionDiv.getAttribute('style');
    expect(style).toContain('rgb(255, 209, 102)'); // Happy color with opacity
  });

  test('does not apply selected styling when not selected', () => {
    const { container } = render(
      <EmotionBar emotion="Sad" value={20} onClick={() => {}} selected={false} />
    );
    const emotionDiv = container.firstChild;
    const style = emotionDiv.getAttribute('style');
    expect(style).toContain('transparent');
  });

  test('progress bar width reflects value percentage', () => {
    const { container } = render(
      <EmotionBar emotion="Surprise" value={60} onClick={() => {}} selected={false} />
    );
    const progressBar = container.querySelector('div > div > div > div');
    const style = progressBar.getAttribute('style');
    expect(style).toContain('width: 60%');
  });
});

describe('UI Components - AlertItem', () => {
  test('renders alert message', () => {
    const alert = { id: 1, time: '12:45:02', type: 'warning', msg: 'Test warning' };
    render(<AlertItem item={alert} />);
    expect(screen.getByText('Test warning')).toBeInTheDocument();
  });

  test('renders alert time', () => {
    const alert = { id: 2, time: '12:44:00', type: 'info', msg: 'Info message' };
    render(<AlertItem item={alert} />);
    expect(screen.getByText('12:44:00')).toBeInTheDocument();
  });

  test('renders correct color for warning type', () => {
    const alert = { id: 1, time: '12:00:00', type: 'warning', msg: 'Warning' };
    const { container } = render(<AlertItem item={alert} />);
    const icon = container.querySelector('span:first-child');
    const style = icon.getAttribute('style');
    expect(style).toContain('rgb(255, 209, 102)'); // warning color
  });

  test('renders correct color for error type', () => {
    const alert = { id: 1, time: '12:00:00', type: 'error', msg: 'Error occurred' };
    const { container } = render(<AlertItem item={alert} />);
    const icon = container.querySelector('span:first-child');
    const style = icon.getAttribute('style');
    expect(style).toContain('rgb(255, 87, 87)'); // error color
  });

  test('renders correct color for success type', () => {
    const alert = { id: 1, time: '12:00:00', type: 'success', msg: 'Success' };
    const { container } = render(<AlertItem item={alert} />);
    const icon = container.querySelector('span:first-child');
    const style = icon.getAttribute('style');
    expect(style).toContain('rgb(6, 214, 160)'); // success color
  });
});

describe('UI Components - StatBadge', () => {
  test('renders value and label', () => {
    render(<StatBadge value={92.5} label="Accuracy" color="#06D6A0" />);
    expect(screen.getByText('92.5')).toBeInTheDocument();
    expect(screen.getByText('ACCURACY')).toBeInTheDocument();
  });

  test('applies suffix to value', () => {
    render(<StatBadge value={45} label="FPS" color="#5E9AFF" suffix=" fps" />);
    expect(screen.getByText('45 fps')).toBeInTheDocument();
  });

  test('renders without suffix when not provided', () => {
    render(<StatBadge value={100} label="Faces" color="#FFD166" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('uses provided color for styling', () => {
    const { container } = render(
      <StatBadge value={88} label="Precision" color="#C77DFF" />
    );
    const badge = container.firstChild;
    const style = badge.getAttribute('style');
    expect(style).toContain('rgb(199, 125, 255)'); // C77DFF color
  });

  test('handles string values', () => {
    render(<StatBadge value="v3.2.1" label="Model Version" color="#5E9AFF" />);
    expect(screen.getByText('v3.2.1')).toBeInTheDocument();
  });

  test('labels are uppercase', () => {
    render(<StatBadge value={50} label="test metric" color="#FFD166" />);
    expect(screen.getByText('TEST METRIC')).toBeInTheDocument();
  });
});
