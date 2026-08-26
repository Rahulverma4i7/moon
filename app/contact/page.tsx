// app/contact/page.tsx
import { ContactForm } from './ContactForm'

export const metadata = {
  title: 'Contact - Lunar Decider',
  description: 'Get in touch with the Lunar Decider team.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Contact
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        Questions about aligning your decisions with the cosmos? Send us a note
        and we&apos;ll get back to you before the next full moon.
      </p>

      {/* Render the Client Component here */}
      <ContactForm />
    </div>
  )
}