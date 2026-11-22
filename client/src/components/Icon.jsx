const paths = {
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </>
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  pencil: <path d="M11.3 2.4 13.6 4.7 5.5 12.8 2.8 13.2l.4-2.7z" />,
  trash: (
    <>
      <path d="M2.8 4.5h10.4M6 4.5V2.8h4v1.7M4.3 4.5l.6 8.7h6.2l.6-8.7" />
    </>
  ),
  check: <path d="m3 8.4 3.1 3.1L13 4.8" />,
  chevronDown: <path d="m3.5 6 4.5 4.5L12.5 6" />,
}

export default function Icon({ name, size = 16, strokeWidth = 1.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
