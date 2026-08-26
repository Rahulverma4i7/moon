// app/contact/ContactForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 🔥 Your WhatsApp number (no '+' sign, country code included)
const PHONE_NUMBER = '917807326663' // India +91

export function ContactForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')

    const handleWhatsAppRedirect = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email || !message) {
            alert('Please fill in all fields before sending.')
            return
        }

        const text = `Hello! My name is ${name}.%0A%0AEmail: ${email}%0A%0AMessage: ${message}`
        const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`

        // Opens WhatsApp in a new tab (works on mobile & desktop)
        window.open(url, '_blank')
    }

    return (
        <form onSubmit={handleWhatsAppRedirect} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Luna Skywalker"
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-foreground backdrop-blur-md outline-none focus:ring-2 focus:ring-amber-400"
                    required
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@cosmos.space"
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-foreground backdrop-blur-md outline-none focus:ring-2 focus:ring-amber-400"
                    required
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-muted-foreground">
                    Message
                </label>
                <textarea
                    id="message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-2 leading-relaxed text-foreground backdrop-blur-md outline-none focus:ring-2 focus:ring-amber-400"
                    required
                />
            </div>
            <Button
                type="submit"
                className="mt-2 self-start bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-all"
            >
                Send Message 💬
            </Button>
        </form>
    )
}