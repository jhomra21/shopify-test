import { onMount, createSignal } from 'solid-js';
import { Link } from '@tanstack/solid-router'; // Corrected import for navigation

function App() {
  const [titleClass, setTitleClass] = createSignal("fade-in-up-initial");
  const [cardClass, setCardClass] = createSignal("fade-in-up-initial");
  const [buttonClass, setButtonClass] = createSignal("fade-in-up-initial");

  onMount(() => {
    setTimeout(() => {
      setTitleClass("fade-in-up-active");
    }, 100); // First element delay
    setTimeout(() => {
      setCardClass("fade-in-up-active");
    }, 300); // Second element delay (100 + 200)
    setTimeout(() => {
      setButtonClass("fade-in-up-active");
    }, 500); // Third element delay (300 + 200)
  });

  return (
    <main class="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div class="space-y-8 text-center">
        <h1 class={`text-5xl font-bold text-sky-400 ${titleClass()}`}> 
          Welcome to Gemini Image Editor!
        </h1>

        <div 
          class={`bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full ${cardClass()}`}
        >
          <h2 class="text-3xl font-semibold mb-4 text-sky-300">What is this?</h2>
          <p class="text-slate-300 text-lg">
            This application demonstrates the power of AI in image editing. 
            Navigate to the Dummy page to test a simple API integration or explore other features.
          </p>
        </div>

        <Link 
          to="/dummy"
          preload="intent"
          class={`px-8 py-3 bg-sky-500 text-white font-semibold rounded-lg shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform hover:scale-105 ${buttonClass()}`}
        >
          Go to API Tester (Dummy Route)
        </Link>
      </div>
    </main>
  );
}

export default App;
