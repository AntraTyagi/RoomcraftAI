import NavBar from "@/components/nav-bar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      {children}
    </div>
  );
}
