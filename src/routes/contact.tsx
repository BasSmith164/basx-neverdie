import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useStore();
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-center glow-text">ติดต่อเรา</h1>
      <p className="text-center text-muted-foreground mt-2">Contact</p>

      <Card className="mt-8 p-8 border-primary/40 glow-primary text-center">
        <a href={settings.discordUrl} target="_blank" rel="noreferrer" className="inline-block">
          <div className="mx-auto h-32 w-32 rounded-full flex items-center justify-center" style={{ background: "#5865F2" }}>
            <DiscordIcon />
          </div>
        </a>
        <h2 className="text-2xl font-bold mt-6">Discord Community</h2>
        <p className="text-sm text-muted-foreground mt-2">เข้าร่วม Discord ของเราเพื่อรับการช่วยเหลือ และข่าวสารล่าสุด</p>
        <Button asChild className="mt-6 gradient-primary text-primary-foreground glow-primary" size="lg">
          <a href={settings.discordUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="h-5 w-5 mr-2" />เข้าร่วม Discord
          </a>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground break-all">{settings.discordUrl}</p>
      </Card>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 fill-white" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
