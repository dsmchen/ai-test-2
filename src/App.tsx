import Game from './components/Game'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4 animate-fade-in-up">Tower Defense</h1>
      <Game />
    </div>
  )
}

export default App
