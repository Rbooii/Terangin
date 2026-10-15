import FadeIn from "./FadeIn";

export default function Wordmark() {
  return (
    <section className="mt-20 px-4 pt-8 sm:mt-28 sm:px-6">
      <FadeIn>
        <svg
          viewBox="0 0 1200 200"
          className="block w-full select-none"
          role="img"
          aria-label="Terang.in"
        >
          <defs>
            <linearGradient id="wordmark-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--theme-wordmark-from)" />
              <stop offset="0.42" stopColor="var(--theme-wordmark-from)" />
              <stop offset="0.68" stopColor="var(--theme-wordmark-mid)" />
              <stop offset="0.88" stopColor="var(--theme-wordmark-to)" />
              <stop offset="1" stopColor="var(--theme-wordmark-to)" />
            </linearGradient>
          </defs>
          <text
            x="600"
            y="168"
            textAnchor="middle"
            textLength="1180"
            lengthAdjust="spacingAndGlyphs"
            fontSize="196"
            fontWeight="700"
            fill="url(#wordmark-fill)"
          >
            TERANG.IN
          </text>
        </svg>
      </FadeIn>
    </section>
  );
}
