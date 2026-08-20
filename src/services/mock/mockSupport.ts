import { ChatMessage, FaqItem, SupportService } from "../types";
import { delay } from "./utils";

const FAQS: FaqItem[] = [
  { id: "1", question: "How do I start my duty?", answer: "Go online from the Home screen, complete the pre-duty readiness checklist, then slide to start once approved." },
  { id: "2", question: "What happens if I go over the package km/hours?", answer: "Extra kilometres and time are added to the bill automatically as Additional Charges." },
  { id: "3", question: "How do I collect payment from a client?", answer: "Open Payment & Billing and show the client the QR code, or mark it as a cash payment received." },
  { id: "4", question: "What if a document upload fails verification?", answer: "You'll see an error screen explaining the issue — retake or re-upload the document and resubmit." },
  { id: "5", question: "Who do I contact for a duty cancellation?", answer: "Ask your ops team or the LuxoRides ops team to cancel the duty on your behalf." },
];

export class MockSupportService implements SupportService {
  private messages: ChatMessage[] = [
    { id: "1", from: "support", text: "Hi Raja, this is LuxoRides support. How can we help today?", timestamp: "09:12 AM" },
  ];

  async getFaqs(): Promise<FaqItem[]> {
    return delay(FAQS, 400);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return delay(this.messages, 300);
  }

  async sendChatMessage(text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: String(this.messages.length + 1), from: "driver", text, timestamp: "Just now" };
    this.messages.push(msg);
    await delay(null, 400);
    const reply: ChatMessage = {
      id: String(this.messages.length + 1),
      from: "support",
      text: "Thanks, we're looking into this and will get back to you shortly.",
      timestamp: "Just now",
    };
    this.messages.push(reply);
    return reply;
  }
}
