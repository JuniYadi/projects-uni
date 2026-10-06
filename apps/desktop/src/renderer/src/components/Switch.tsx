export function Switch({
  checked,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-150 ease-out focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-[#22C55E]' : 'bg-[#CBD5E1] dark:bg-[#334155]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-[20px] rounded-full bg-white shadow-sm transition-transform duration-150 ease-out ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
