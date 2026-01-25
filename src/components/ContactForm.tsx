import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactForm({ open, onOpenChange }: ContactFormProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create mailto link and redirect to user's mail app
    const mailto = `mailto:truelytechtechnolgies@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    // Close the dialog after redirecting
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            For any other enquiry, email us at <b>truelytechtechnolgies@gmail.com</b>
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="your.email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input name="subject" type="text" required value={form.subject} onChange={handleChange} placeholder="What's this about?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea name="message" required value={form.message} onChange={handleChange} placeholder="Tell us how we can help you..." className="min-h-[100px]" />
          </div>
          <Button type="submit" className="w-full">Send Enquiry</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
