import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeatherCard from './WeatherCard';

const baseLocation = {
  name: 'Karachi',
  admin1: 'Sindh',
  country: 'Pakistan',
};

const baseCurrent = {
  temperature: 32,
  weatherCode: 0,
  feelsLike: 34,
  humidity: 55,
  windSpeed: 12,
};

describe('WeatherCard', () => {
  it('renders nothing when location or current data is missing', () => {
    const { container: noLocation } = render(
      <WeatherCard location={null} current={baseCurrent} />
    );
    expect(noLocation).toBeEmptyDOMElement();

    const { container: noCurrent } = render(
      <WeatherCard location={baseLocation} current={null} />
    );
    expect(noCurrent).toBeEmptyDOMElement();
  });

  it('renders location name, subtitle, and rounded temperature', () => {
    render(<WeatherCard location={baseLocation} current={baseCurrent} />);

    expect(screen.getByText('Karachi')).toBeInTheDocument();
    expect(screen.getByText('Sindh, Pakistan')).toBeInTheDocument();
    expect(screen.getByText('32°')).toBeInTheDocument();
  });

  it('renders the core stat chips (feels like, humidity, wind)', () => {
    render(<WeatherCard location={baseLocation} current={baseCurrent} />);

    expect(screen.getByText('34°')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
  });

  it('does not render UV/sunrise/sunset row when that data is absent', () => {
    render(<WeatherCard location={baseLocation} current={baseCurrent} />);

    expect(screen.queryByText('UV index')).not.toBeInTheDocument();
    expect(screen.queryByText('Sunrise')).not.toBeInTheDocument();
    expect(screen.queryByText('Sunset')).not.toBeInTheDocument();
  });

  it('renders UV index and sunrise/sunset when provided', () => {
    const currentWithExtras = {
      ...baseCurrent,
      uvIndex: 6,
      sunrise: '6:12 AM',
      sunset: '6:45 PM',
    };

    render(<WeatherCard location={baseLocation} current={currentWithExtras} />);

    expect(screen.getByText('UV index')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('6:12 AM')).toBeInTheDocument();
    expect(screen.getByText('6:45 PM')).toBeInTheDocument();
  });

  it('shows high/low temperature range when tempMax and tempMin are present', () => {
    const currentWithRange = { ...baseCurrent, tempMax: 35, tempMin: 24 };

    render(<WeatherCard location={baseLocation} current={currentWithRange} />);

    expect(screen.getByText(/H:35°/)).toBeInTheDocument();
    expect(screen.getByText(/L:24°/)).toBeInTheDocument();
  });
});
