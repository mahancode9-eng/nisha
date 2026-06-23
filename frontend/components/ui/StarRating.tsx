"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function StarRating({
  value,
  onChange,
  max = 5,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="امتیاز">
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        const half = !filled && starValue - 0.5 <= value;
        return (
          <button
            key={starValue}
            type="button"
            disabled={readonly}
            aria-label={`${starValue} از ${max}`}
            aria-checked={starValue === value}
            role={onChange ? "radio" : undefined}
            onClick={() => onChange?.(starValue)}
            className={`${readonly ? "" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`${SIZE_CLASS[size]} ${filled ? "text-amber-400" : half ? "text-amber-300/50" : "text-foreground-muted"}`}
              fill={filled || half ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        );
      })}
      <span className="me-2 text-sm text-foreground-muted">
        {value} / {max}
      </span>
    </div>
  );
}
