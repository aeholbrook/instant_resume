"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:your@email.com?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm text-neutral-600 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400 transition-colors"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm text-neutral-600 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400 transition-colors"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm text-neutral-600 mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full px-4 py-3 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400 transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3 text-sm border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}