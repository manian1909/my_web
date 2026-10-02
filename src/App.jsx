import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { Experience } from './components/Experience'
import { About } from './components/About'
import { Hobbies } from './components/Hobbies'
import { Contact } from './components/Contact'
import { CommandPalette } from './components/CommandPalette'
import { ScrollProgress } from './components/ScrollProgress'
import { KeyboardNav } from './components/KeyboardNav'
import { LensProvider } from './lens'

export default function App() {
  return (
    <LensProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <ScrollProgress />
      <Header />
      <CommandPalette />
      <KeyboardNav />
      <main id="main">
        <Hero />
        <Work />
        <Experience />
        <About />
        <Hobbies />
      </main>
      <Contact />
    </LensProvider>
  )
}
