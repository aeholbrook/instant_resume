import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-neutral-900 mb-4">Contact</h1>
      <p className="text-neutral-500 mb-10">
        Have a question or want to work together? Send me a message.
      </p>
      <ContactForm />
    </section>
  );
}