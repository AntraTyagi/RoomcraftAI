<<<<<<< HEAD
import { jsxDEV } from "react/jsx-dev-runtime";
import NavBar from "./nav-bar";
=======
import NavBar from "@/components/nav-bar";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

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
