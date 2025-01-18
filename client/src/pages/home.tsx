import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { PlusCircle, Sparkles } from "lucide-react";

const STYLE_PREVIEWS = [
  {
    title: "Modern",
    image: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3",
  },
  {
    title: "Bohemian",
    image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da",
  },
  {
    title: "Victorian",
    image: "https://images.unsplash.com/photo-1472228283686-42356d789f66",
  },
  {
    title: "Contemporary",
    image: "https://images.unsplash.com/photo-1611094016919-36b65678f3d6",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to RoomcraftAI
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Transform your space with AI-powered interior design concepts
        </p>
        <Link href="/generate">
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Start New Design
          </Button>
        </Link>
      </header>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Design Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STYLE_PREVIEWS.map((style) => (
            <Card key={style.title} className="overflow-hidden group">
              <CardContent className="p-0 relative">
                <img
                  src={style.image}
                  alt={style.title}
                  className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-center">
                    <h3 className="text-xl font-bold mb-2">{style.title}</h3>
                    <Sparkles className="w-6 h-6 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}