import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const callApi = () => {
    fetch('/api/health')
      .then((res) => res.text())
      .then((data) => console.log(data))
  }
  return (
    <div className="text-center">
      <button onClick={callApi}>Click me</button>
    </div>
  )
}
