import { Link, NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sectors } from "@/data/sectors";
import { ChevronDown, Menu, LogOut } from "lucide-react";
import { useAuthContext } from "@/lib/auth-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthContext();
  return (
    <div className="min-h-[100svh] md:min-h-screen w-full flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="h-1 w-full brand-gradient" />
        <div className="container flex items-center justify-between py-3 gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold tracking-tight"
          >
            <img
              src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
              alt="Evoque Fitness Logo"
              className="h-6 w-auto rounded-sm shadow-sm"
              loading="lazy"
              decoding="async"
            />
            <span className="text-lg">Evoque Fitness</span>
          </Link>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`
              }
            >
              Início
            </NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full">
                  Setores <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sectors.map((s) => (
                  <Link key={s.slug} to={`/login?redirect=/setor/${s.slug}`}>
                    <DropdownMenuItem>{s.title}</DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="ml-2 hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
                  <div className="h-6 w-6 rounded-full bg-primary/90" />
                  <span>{user?.name || "Administrador"}</span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {user?.email || "admin@evoque.com"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="size-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-md">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] p-0">
                <div className="p-4 border-b border-border/60 flex items-center gap-2">
                  <img
                    src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
                    alt="Evoque Fitness Logo"
                    className="h-6 w-auto rounded-sm"
                  />
                  <span className="font-semibold">Evoque Fitness</span>
                </div>
                <div className="p-4 space-y-2">
                  <SheetClose asChild>
                    <Link
                      to="/"
                      className="block rounded-md px-3 py-2 bg-secondary"
                    >
                      Início
                    </Link>
                  </SheetClose>
                  <div className="mt-2 text-xs uppercase text-muted-foreground px-1">
                    Setores
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {sectors.map((s) => (
                      <SheetClose asChild key={s.slug}>
                        <Link
                          to={`/setor/${s.slug}`}
                          className="block rounded-md px-3 py-2 hover:bg-secondary"
                        >
                          {s.title}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t border-border/60">
        <div className="container py-6 text-xs text-muted-foreground flex items-center justify-between">
          <p>© {new Date().getFullYear()} Evoque Fitness</p>
          <p>Sistema interno</p>
        </div>
      </footer>
    </div>
  );
}
