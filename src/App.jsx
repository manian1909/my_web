import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { Experience } from './components/Experience'
import { About } from './components/About'
import { Hobbies } from './components/Hobbies'
import { Contact } from './components/Contact'
import { CommandPalette } from './components/CommandPalette'
import { ScrollProgress } from './components/ScrollProgress'

export default function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <ScrollProgress />
      <Header />
      <CommandPalette />
      <main id="main">
        <Hero />
        <Work />
        <Experience />
        <About />
        <Hobbies />
      </main>
      <Contact />
    </>
  )
}
