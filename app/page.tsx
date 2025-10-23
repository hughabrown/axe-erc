import { Chat } from './chat';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#36322F] dark:text-white">
              Axelera AI
            </h1>
            <p className="text-sm font-light text-zinc-600 dark:text-zinc-400">
              ERC due diligence agent
            </p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl lg:text-4xl text-[#36322F] dark:text-white font-semibold tracking-tight opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
            HRDD Assessment Tool
          </h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:400ms] [animation-fill-mode:forwards]">
            Enter customer information below to conduct a Human Rights Due Diligence assessment. The agent will perform research to provide a comprehensive risk analysis for a given sales opportunity.
          </p>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1">
        {/* Chat component handles dossier form and assessment display */}
        <Chat />
      </div>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            For internal use by the Ethics Review Committee
          </p>
        </div>
      </footer>
    </div>
  );
}
