import Link from 'next/link';

export default function Manual() {
  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-400 text-sm mb-8 block"
        >
          ← Back to Game
        </Link>

        <h1 className="text-3xl font-bold text-red-500 mb-6">Expert Manual</h1>

        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <p className="text-zinc-300 mb-4">
            The full defusal manual is available at:
          </p>
          <a
            href="https://www.bombmanual.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xl font-medium underline"
          >
            www.bombmanual.com →
          </a>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-zinc-200">Quick Reference</h2>

          <div className="space-y-4">
            <div className="border-b border-zinc-700 pb-4">
              <h3 className="text-yellow-400 font-medium mb-2">Wires</h3>
              <p className="text-zinc-400 text-sm">
                Determine number of wires (3-6). Check rules based on colors present and serial number.
              </p>
            </div>

            <div className="border-b border-zinc-700 pb-4">
              <h3 className="text-blue-400 font-medium mb-2">The Button</h3>
              <p className="text-zinc-400 text-sm">
                Check button color + label. May need to hold and release at specific timer digit.
              </p>
            </div>
          </div>

          <p className="text-zinc-500 text-sm">
            ⚠️ Ask the Defuser for: Serial number, battery count, lit indicators
          </p>
        </div>
      </div>
    </div>
  );
}