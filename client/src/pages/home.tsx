import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { PlusCircle, Image, Palette } from "lucide-react";
import NavBar from "@/components/nav-bar";
import { Sparkles } from "lucide-react";

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
      <NavBar />

      {/* Hero Banner */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-background to-background/20 z-10" />
        <div
          className="h-[500px] bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000')`,
          }}
        />
        <div className="absolute inset-0 flex items-center z-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-2xl">
              Transform Your Space with AI-Powered Design
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Experience the future of interior design with our cutting-edge AI technology
            </p>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Full Remake Option */}
          <Card className="group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <Palette className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Full Room Remake</h3>
              <p className="text-muted-foreground mb-6">
                Transform your existing space with complete AI-powered redesigns.
                Upload your room photo and get multiple style variations.
              </p>
              <Link href="/generate">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Start Redesign
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Virtual Staging Option */}
          <Card className="group hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <Image className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Virtual Staging</h3>
              <p className="text-muted-foreground mb-6">
                Perfect for real estate. Stage empty rooms with furniture and decor
                to help potential buyers visualize the space.
              </p>
              <Button className="w-full" variant="secondary" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Design Styles Section (from original code) */}
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