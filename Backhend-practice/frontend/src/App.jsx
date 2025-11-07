import './index.css'
import './app.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [jokes, setjokes] = useState([])

  useEffect(() => {
    axios.get('/api/jokes')
    .then((Response) => {
      setjokes(Response.data)
    }
    ) 
  
  .catch((error) => {
    console.log(error);
  }
  )
})

  return (
    <>
      <div className="child">
      <h1>Welcome to Code for full stack</h1>
      <p>Jokes: {jokes.length} </p>

      {
        jokes.map((jokes) => (
          <div key={jokes.id}>
            <h3> {jokes.title} </h3>
            <p> {jokes.content} </p>
          </div>
        ))
      }
      </div>
    </>
  )
}

export default App
