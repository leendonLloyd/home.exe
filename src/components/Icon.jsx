const PATHS = {
  tshirt: 'M8 3 4 5.5 2 9.5l3.2 1.6L6.5 9v12h11V9l1.3 2.1L22 9.5 20 5.5 16 3s-.9 2.2-4 2.2S8 3 8 3Z',
  polo: 'M8 3 4 5.5 2 9.5l3.2 1.6L6.5 9v12h11V9l1.3 2.1L22 9.5 20 5.5 16 3l-4 4-4-4Zm4 4v5',
  pants: 'M7 3h10l1 18h-4.2L12 11l-1.8 10H6L7 3Z',
  shorts: 'M6 4h12l1 11h-5l-2-5-2 5H5L6 4Z',
  dress: 'M9 3h6l-.8 4L19 21H5l4.8-14L9 3Zm0 0L6.5 5M15 3l2.5 2',
  jacket: 'M8 3 3.5 5.5 3 21h5V11m8-8 4.5 2.5.5 15.5h-5V11M8 3s1.2 4.5 4 4.5S16 3 16 3M12 7.5V21',
  socks: 'M9 3h5v10.2c0 2 6 2.8 6 5.6A2.2 2.2 0 0 1 17.8 21H14a5 5 0 0 1-5-5V3Z',
  underwear: 'M4 5h16l-1 7c-3 1.1-5.5 3.2-7 7-1.5-3.8-4-5.9-7-7L4 5Z',
  towel: 'M7 3h10a2 2 0 0 1 2 2v16H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 0a4 4 0 0 0-4 4M7 9h12M7 12h12',
  bedsheet: 'M3 5h18v14H3V5Zm0 5c4 2.5 6.5-2.5 9 0s5-1.5 9 0',
  pillow: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm3.5-1.5 9 11',
  duvet: 'M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm0 4h18',
  cap: 'M3 15a9 9 0 0 1 18 0H3Zm0 0h18a2 2 0 0 1-2 3H5a2 2 0 0 1-2-3Z',
  hanger: 'M12 3a2.2 2.2 0 0 1 2.2 2.2c0 2.3-2.2 1.9-2.2 4.3M3 18l9-8 9 8a1.4 1.4 0 0 1-1.3 2H4.3A1.4 1.4 0 0 1 3 18Z',
  basket: 'M3 8h18l-1.6 11.2A2 2 0 0 1 17.4 21H6.6a2 2 0 0 1-2-1.8L3 8Zm4.5 0L10 3m6.5 5L14 3M7 12v5m5-5v5m5-5v5',
  bag: 'M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
  dumbbell: 'M4 9v6m3-8v10m0-5h10m3-5v10m3-8v6',
  home: 'M4 11 12 4l8 7M6 10v10h5v-6h2v6h5V10',
  bolt: 'M13 3 4 14h6l-1 7 9-11h-6l1-7Z',
  droplet: 'M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z',
  wifi: 'M4 9a12 12 0 0 1 16 0M7 12.5a8 8 0 0 1 10 0M10 16a4 4 0 0 1 4 0M12 19.5v.01',
  phone: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h4',
  card: 'M2 6h20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm-1 5h22M5 15h4',
  shield: 'M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z',
  receipt: 'M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2Zm3 6h6m-6 4h6m-6 4h4',
};

export const ICON_KEYS = Object.keys(PATHS);

export default function Icon({ name, size = 22, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? PATHS.hanger} />
    </svg>
  );
}
